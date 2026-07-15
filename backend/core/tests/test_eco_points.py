import pytest
from core.models import Order

pytestmark = pytest.mark.django_db


def test_listing_awards_points_only_not_impact(item_factory):
    """Listing grants the 50 listing points but must NOT touch sold-count or
    the environmental impact — an unsold item hasn't been reused."""
    item = item_factory()
    seller = item.seller
    seller.refresh_from_db()

    assert seller.eco_points == 50
    assert seller.items_sold_count == 0
    assert seller.co2_saved == 0
    assert seller.water_saved == 0


def test_paid_credits_buyer_and_seller(item_factory, user_factory):
    item = item_factory()
    seller = item.seller
    buyer = user_factory(username='buyer')

    order = Order.objects.create(buyer=buyer, item=item, status='PENDING', total_amount=item.price)
    order.status = 'PAID'
    order.save()

    buyer.refresh_from_db()
    seller.refresh_from_db()

    # Buyer: purchase points + bought count
    assert buyer.eco_points == 20
    assert buyer.items_bought_count == 1
    # Seller: sold count + impact land at the sale, points unchanged from listing
    assert seller.items_sold_count == 1
    assert seller.co2_saved == 5.5
    assert seller.water_saved == 2700
    assert seller.eco_points == 50


def test_paid_is_idempotent(item_factory, user_factory):
    """Re-saving an already-PAID order must not award anything twice."""
    item = item_factory()
    buyer = user_factory(username='buyer')
    order = Order.objects.create(buyer=buyer, item=item, status='PENDING', total_amount=item.price)

    order.status = 'PAID'
    order.save()
    order.save()  # second save, still PAID → no transition

    buyer.refresh_from_db()
    item.seller.refresh_from_db()
    assert buyer.eco_points == 20
    assert buyer.items_bought_count == 1
    assert item.seller.items_sold_count == 1
