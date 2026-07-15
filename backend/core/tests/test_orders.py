import types
import pytest
from core.models import Order, Item
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


def test_single_item_checkout_creates_pending_order(auth_client, item_factory, fake_stripe):
    item = item_factory()
    res = auth_client.post('/api/create-checkout-session/', {'item_id': item.id})

    assert res.status_code == 200
    assert res.data['url'] == 'https://stripe.test/pay'
    assert fake_stripe['count'] == 1
    order = Order.objects.get(item=item)
    assert order.status == 'PENDING'
    assert order.buyer == auth_client.user
    assert order.stripe_payment_intent == 'cs_test_123'


def test_multi_item_checkout_creates_one_order_each(auth_client, item_factory, fake_stripe):
    a, b = item_factory(), item_factory()
    res = auth_client.post('/api/create-checkout-session/', {'item_ids': [a.id, b.id]}, format='json')

    assert res.status_code == 200
    assert fake_stripe['count'] == 2
    orders = Order.objects.filter(stripe_payment_intent='cs_test_123')
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


def test_webhook_marks_paid_and_is_idempotent(auth_client, item_factory, fake_stripe):
    a, b = item_factory(), item_factory()
    auth_client.post('/api/create-checkout-session/', {'item_ids': [a.id, b.id]}, format='json')

    session = {'id': 'cs_test_123'}
    handle_checkout_completion(session)

    for item in (a, b):
        item.refresh_from_db()
        assert item.is_sold is True
    orders = Order.objects.filter(stripe_payment_intent='cs_test_123')
    assert all(o.status == 'PAID' for o in orders)

    buyer = auth_client.user
    buyer.refresh_from_db()
    points_after_first = buyer.eco_points

    # Replayed webhook — must not award again
    handle_checkout_completion(session)
    buyer.refresh_from_db()
    assert buyer.eco_points == points_after_first
    assert buyer.items_bought_count == 2
