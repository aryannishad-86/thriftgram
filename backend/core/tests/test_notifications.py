import pytest
from core.models import Order
from notifications.models import Notification

pytestmark = pytest.mark.django_db


@pytest.fixture
def spy_emails(monkeypatch):
    """Record calls to the order emails as bound in notifications.signals."""
    calls = {'confirmation': 0, 'seller': 0}
    monkeypatch.setattr('notifications.signals.send_order_confirmation',
                        lambda order: calls.__setitem__('confirmation', calls['confirmation'] + 1))
    monkeypatch.setattr('notifications.signals.send_new_order_notification',
                        lambda order: calls.__setitem__('seller', calls['seller'] + 1))
    return calls


def test_no_email_on_pending_order(item_factory, user_factory, spy_emails):
    item = item_factory()
    buyer = user_factory(username='buyer')
    Order.objects.create(buyer=buyer, item=item, status='PENDING', total_amount=item.price)

    assert spy_emails['confirmation'] == 0
    assert spy_emails['seller'] == 0


def test_emails_sent_on_paid(item_factory, user_factory, spy_emails):
    item = item_factory()
    buyer = user_factory(username='buyer')
    order = Order.objects.create(buyer=buyer, item=item, status='PENDING', total_amount=item.price)

    order.status = 'PAID'
    order.save()

    assert spy_emails['confirmation'] == 1
    assert spy_emails['seller'] == 1


def test_mark_all_read(auth_client, user_factory):
    sender = user_factory(username='sender')
    Notification.objects.create(recipient=auth_client.user, sender=sender,
                                notification_type='follow', message='hi', is_read=False)
    Notification.objects.create(recipient=auth_client.user, sender=sender,
                                notification_type='like', message='liked', is_read=False)

    res = auth_client.post('/api/notifications/mark_all_read/')
    assert res.status_code == 200
    assert Notification.objects.filter(recipient=auth_client.user, is_read=False).count() == 0
