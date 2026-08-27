import pytest

pytestmark = pytest.mark.django_db


def test_add_to_wishlist_returns_serialized_object(auth_client, item_factory):
    item = item_factory()
    res = auth_client.post('/api/wishlist/', {'item': item.id})
    assert res.status_code == 201
    assert res.data['item']['id'] == item.id
    assert 'added_at' in res.data


def test_adding_already_wishlisted_item_returns_same_shape(auth_client, item_factory):
    """M1: was {'status': 'already in wishlist'} on the second call — a
    genuinely different shape from the 201 response above. Both now return
    the same WishlistSerializer body; only the status code (200 vs 201)
    distinguishes created-vs-already-existed."""
    item = item_factory()
    auth_client.post('/api/wishlist/', {'item': item.id})

    res = auth_client.post('/api/wishlist/', {'item': item.id})
    assert res.status_code == 200
    assert res.data['item']['id'] == item.id
    assert 'added_at' in res.data
    assert 'status' not in res.data
