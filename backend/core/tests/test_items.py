import pytest
from core.models import Item, Like

pytestmark = pytest.mark.django_db


def test_create_item_sets_seller_to_current_user(auth_client):
    res = auth_client.post('/api/items/', {
        'title': 'Denim Jacket', 'description': 'Blue', 'price': '1200.00',
        'size': 'L', 'condition': 'LIKE_NEW',
    })
    assert res.status_code == 201
    item = Item.objects.get(title='Denim Jacket')
    assert item.seller == auth_client.user


def test_cannot_edit_another_users_item(api_client, item_factory, user_factory):
    item = item_factory()
    other = user_factory(username='intruder')
    api_client.force_authenticate(user=other)

    res = api_client.patch(f'/api/items/{item.id}/', {'title': 'Hacked'})
    assert res.status_code in (403, 404)
    item.refresh_from_db()
    assert item.title != 'Hacked'


def test_like_then_unlike(auth_client, item_factory):
    item = item_factory()

    r1 = auth_client.post(f'/api/items/{item.id}/like/')
    assert r1.status_code == 201
    assert Like.objects.filter(user=auth_client.user, item=item).exists()

    r2 = auth_client.post(f'/api/items/{item.id}/like/')
    assert r2.status_code == 400  # already liked

    r3 = auth_client.post(f'/api/items/{item.id}/unlike/')
    assert r3.status_code == 204
    assert not Like.objects.filter(user=auth_client.user, item=item).exists()


def test_search_filters_by_title(api_client, item_factory):
    item_factory(title='Green Hoodie')
    item_factory(title='Red Sneakers')

    res = api_client.get('/api/items/?search=Hoodie')
    assert res.status_code == 200
    items = res.data['results'] if isinstance(res.data, dict) else res.data
    titles = [i['title'] for i in items]
    assert 'Green Hoodie' in titles
    assert 'Red Sneakers' not in titles


def test_drop_filter(api_client, item_factory):
    from core.models import DropEvent
    from django.utils import timezone
    in_drop = item_factory(title='Exclusive')
    item_factory(title='Regular')
    drop = DropEvent.objects.create(title='D', description='d',
                                    start_time=timezone.now(), end_time=timezone.now())
    drop.items.add(in_drop)

    res = api_client.get(f'/api/items/?drop={drop.id}')
    assert res.status_code == 200
    items = res.data['results'] if isinstance(res.data, dict) else res.data
    assert [i['title'] for i in items] == ['Exclusive']
