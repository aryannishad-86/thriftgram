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


def test_is_liked_reflects_current_user_via_annotation(auth_client, item_factory, user_factory):
    """get_is_liked reads ItemViewSet's Exists() annotation now, not a
    per-row .filter().exists() query — correctness check that the annotation
    actually reflects reality for both the liking user and an uninvolved one."""
    item = item_factory()
    other = user_factory(username='otherliker')
    from core.models import Like
    Like.objects.create(user=other, item=item)  # someone else likes it — should not count as "liked" for auth_client.user

    res = auth_client.get(f'/api/items/{item.id}/')
    assert res.status_code == 200
    assert res.data['is_liked'] is False

    auth_client.post(f'/api/items/{item.id}/like/')
    res2 = auth_client.get(f'/api/items/{item.id}/')
    assert res2.data['is_liked'] is True


def test_is_liked_false_for_anonymous(api_client, item_factory):
    """AnonymousUser can't be used in a User FK filter — _annotate_is_liked
    must fall back to a constant False rather than erroring."""
    item = item_factory()
    res = api_client.get(f'/api/items/{item.id}/')
    assert res.status_code == 200
    assert res.data['is_liked'] is False


def test_nested_seller_is_lean_summary_shape(api_client, item_factory):
    """ItemSerializer.seller is UserSummarySerializer now — confirm the
    nested object doesn't carry followers_count/email/is_following, which
    each cost their own query under the old full UserSerializer."""
    item_factory()
    res = api_client.get('/api/items/')
    seller = res.data['results'][0]['seller']
    assert set(seller.keys()) == {'id', 'username', 'profile_picture'}


def test_item_feed_query_count_is_bounded(django_assert_max_num_queries, api_client, item_factory):
    """Regression guard for the N+1 fixes on ItemViewSet: listing 10 items
    (with distinct sellers) measures at 5 queries (count + main select +
    3 prefetches: images/likes/reviews) — page-size-independent, not one
    that scales with item count. Bound set at 6 for a little headroom."""
    for _ in range(10):
        item_factory()
    with django_assert_max_num_queries(6):
        res = api_client.get('/api/items/')
        assert res.status_code == 200
        assert len(res.data['results']) == 10


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
