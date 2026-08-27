import threading
import types
import pytest
from django.db import IntegrityError, transaction
from core.models import Order, Item, ProcessedStripeEvent
from core.stripe_service import StripeService
from core.views import handle_checkout_completion

pytestmark = pytest.mark.django_db


@pytest.fixture
def fake_stripe(monkeypatch):
    """Replace the real Stripe call with a fake session, and capture how many
    line items it was asked to create."""
    calls = {}

    def fake_create(items, success_url, cancel_url):
        items = list(items)
        calls['count'] = len(items)
        return types.SimpleNamespace(id='cs_test_123', url='https://stripe.test/pay')

    monkeypatch.setattr(StripeService, 'create_checkout_session', staticmethod(fake_create))
    return calls


def paid_session(session_id='cs_test_123', payment_intent='pi_test_456'):
    """A minimal Stripe checkout.session object shaped like what
    handle_checkout_completion reads. payment_status='paid' is required —
    the handler now refuses to fulfill sessions that didn't actually collect
    payment (see core/views.py)."""
    return {'id': session_id, 'payment_status': 'paid', 'payment_intent': payment_intent}


def test_single_item_checkout_creates_pending_order(auth_client, item_factory, fake_stripe):
    item = item_factory()
    res = auth_client.post('/api/create-checkout-session/', {'item_id': item.id})

    assert res.status_code == 200
    assert res.data['url'] == 'https://stripe.test/pay'
    assert fake_stripe['count'] == 1
    order = Order.objects.get(item=item)
    assert order.status == 'PENDING'
    assert order.buyer == auth_client.user
    assert order.stripe_checkout_session_id == 'cs_test_123'
    assert order.stripe_payment_intent_id is None  # not known until the webhook fires


def test_multi_item_checkout_creates_one_order_each(auth_client, item_factory, fake_stripe):
    a, b = item_factory(), item_factory()
    res = auth_client.post('/api/create-checkout-session/', {'item_ids': [a.id, b.id]}, format='json')

    assert res.status_code == 200
    assert fake_stripe['count'] == 2
    orders = Order.objects.filter(stripe_checkout_session_id='cs_test_123')
    assert orders.count() == 2
    assert {o.item_id for o in orders} == {a.id, b.id}


def test_cannot_buy_own_item(auth_client, item_factory, fake_stripe):
    mine = item_factory(seller=auth_client.user)
    res = auth_client.post('/api/create-checkout-session/', {'item_id': mine.id})
    assert res.status_code == 400
    assert not Order.objects.exists()


def test_cannot_buy_sold_item(auth_client, item_factory, fake_stripe):
    item = item_factory(is_sold=True)
    res = auth_client.post('/api/create-checkout-session/', {'item_id': item.id})
    assert res.status_code == 400


def test_partial_invalid_cart_creates_nothing(auth_client, item_factory, fake_stripe):
    """If any item in the cart is invalid, no session and no orders are created."""
    good = item_factory()
    mine = item_factory(seller=auth_client.user)
    res = auth_client.post('/api/create-checkout-session/',
                           {'item_ids': [good.id, mine.id]}, format='json')
    assert res.status_code == 400
    assert not Order.objects.exists()


def test_checkout_session_creation_never_leaks_stripe_error_detail(auth_client, item_factory, monkeypatch):
    """A Stripe error message can carry request ids / internal detail. The
    client should get a generic message; the real exception goes to logs."""
    def raise_stripe_error(items, success_url, cancel_url):
        raise ValueError("secret internal stripe detail sk_live_abc123")

    monkeypatch.setattr(StripeService, 'create_checkout_session', staticmethod(raise_stripe_error))
    item = item_factory()
    res = auth_client.post('/api/create-checkout-session/', {'item_id': item.id})

    assert res.status_code == 500
    assert 'sk_live' not in res.data['error']
    assert 'secret internal stripe detail' not in res.data['error']


def test_webhook_marks_paid_captures_payment_intent_and_is_idempotent(auth_client, item_factory, fake_stripe):
    a, b = item_factory(), item_factory()
    auth_client.post('/api/create-checkout-session/', {'item_ids': [a.id, b.id]}, format='json')

    session = paid_session()
    handle_checkout_completion(session)

    for item in (a, b):
        item.refresh_from_db()
        assert item.is_sold is True
    orders = Order.objects.filter(stripe_checkout_session_id='cs_test_123')
    assert all(o.status == 'PAID' for o in orders)
    assert all(o.stripe_payment_intent_id == 'pi_test_456' for o in orders)

    buyer = auth_client.user
    buyer.refresh_from_db()
    points_after_first = buyer.eco_points

    # Replayed webhook — must not award again
    handle_checkout_completion(session)
    buyer.refresh_from_db()
    assert buyer.eco_points == points_after_first
    assert buyer.items_bought_count == 2


def test_webhook_does_not_fulfill_unpaid_session(auth_client, item_factory, fake_stripe):
    """checkout.session.completed also fires for sessions that didn't actually
    collect payment (delayed-notification methods, no_payment_required).
    Fulfilling on session-completion alone, without checking payment_status,
    would let an unpaid session mark an item sold."""
    item = item_factory()
    auth_client.post('/api/create-checkout-session/', {'item_id': item.id})

    handle_checkout_completion({'id': 'cs_test_123', 'payment_status': 'unpaid'})

    order = Order.objects.get(item=item)
    assert order.status == 'PENDING'
    item.refresh_from_db()
    assert item.is_sold is False


class TestProcessedStripeEventGuard:
    """The hard, DB-engine-agnostic defense against a redelivered webhook:
    ProcessedStripeEvent.event_id is unique, so a duplicate insert fails at
    the database level regardless of what races above it in application code.
    This is verified directly here rather than via real concurrent threads —
    the test DB is SQLite :memory:, where (a) Django silently no-ops
    select_for_update(), and (b) each thread's connection would get an
    independent, empty in-memory database rather than a shared one, so a
    genuine multi-threaded test against this DB would prove nothing (or
    worse, fail for reasons unrelated to the fix). A unique constraint,
    unlike SELECT FOR UPDATE, behaves identically on SQLite and Postgres."""

    def test_duplicate_event_id_raises_integrity_error(self):
        ProcessedStripeEvent.objects.create(event_id='evt_test_1', event_type='checkout.session.completed')
        with pytest.raises(IntegrityError):
            with transaction.atomic():  # required so the failed INSERT doesn't poison the outer test transaction
                ProcessedStripeEvent.objects.create(event_id='evt_test_1', event_type='checkout.session.completed')


class TestStripeWebhookEndpoint:
    """Exercises the real /api/stripe-webhook/ view — not handle_checkout_completion
    directly — so the throttle exemption and event-id dedup actually get
    covered. Signature verification is mocked (constructing a validly-signed
    payload isn't necessary to test the app's own logic), matching the
    existing pattern of mocking StripeService.create_checkout_session above."""

    def _post_event(self, api_client, monkeypatch, event, session=None):
        event_obj = {'id': event.get('id', 'evt_test'), 'type': event.get('type', 'checkout.session.completed'),
                     'data': {'object': session or paid_session()}}
        monkeypatch.setattr(StripeService, 'construct_webhook_event',
                            staticmethod(lambda payload, sig, secret: event_obj))
        return api_client.post('/api/stripe-webhook/', data=b'{}', content_type='application/json',
                               HTTP_STRIPE_SIGNATURE='dummy')

    def test_replayed_event_id_is_not_reprocessed(self, api_client, monkeypatch, auth_client, item_factory, fake_stripe):
        item = item_factory()
        auth_client.post('/api/create-checkout-session/', {'item_id': item.id})
        buyer = auth_client.user

        event = {'id': 'evt_replay_test'}
        res1 = self._post_event(api_client, monkeypatch, event)
        assert res1.status_code == 200
        buyer.refresh_from_db()
        points_after_first = buyer.eco_points
        assert points_after_first > 0

        # Same event.id delivered again (Stripe's actual retry behavior) —
        # the ProcessedStripeEvent unique constraint must reject it before
        # handle_checkout_completion runs a second time.
        res2 = self._post_event(api_client, monkeypatch, event)
        assert res2.status_code == 200
        assert res2.data['status'] == 'already processed'
        buyer.refresh_from_db()
        assert buyer.eco_points == points_after_first

    def test_webhook_is_not_throttled(self, api_client, monkeypatch, django_assert_max_num_queries):
        """Regression test for the highest-severity finding in the P0 audit:
        @permission_classes([AllowAny]) does NOT disable DRF's
        DEFAULT_THROTTLE_CLASSES. Before @throttle_classes([]) was added, this
        view landed in the 100/hour anon bucket and a Stripe retry storm (or
        just a busy day) got 429'd — silently stopping order fulfillment."""
        # settings.DEFAULT_THROTTLE_RATES['anon'] is None in tests (see
        # test_settings.py), so hammering the endpoint here wouldn't catch a
        # regression on its own — assert directly on the view's declared
        # throttle classes instead, which is what actually matters in prod.
        from core.views import stripe_webhook
        assert stripe_webhook.cls.throttle_classes == []

    def test_unpaid_session_via_full_webhook_path_does_not_fulfill(self, api_client, monkeypatch, auth_client, item_factory, fake_stripe):
        item = item_factory()
        auth_client.post('/api/create-checkout-session/', {'item_id': item.id})

        res = self._post_event(api_client, monkeypatch, {'id': 'evt_unpaid'},
                               session={'id': 'cs_test_123', 'payment_status': 'unpaid'})
        assert res.status_code == 200
        order = Order.objects.get(item=item)
        assert order.status == 'PENDING'
