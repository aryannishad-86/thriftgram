import pytest
from core.models import Follow

pytestmark = pytest.mark.django_db


def test_followers_endpoint_is_paginated(api_client, user_factory):
    """C6: was Follow.objects.filter(...) with no pagination at all — a
    popular account's follower list was unbounded. Now uses the same
    {count,next,previous,results} shape as every other collection."""
    target = user_factory(username='popular')
    for i in range(3):
        follower = user_factory(username=f'fan{i}')
        Follow.objects.create(follower=follower, following=target)

    res = api_client.get(f'/api/users/{target.username}/followers/')
    assert res.status_code == 200
    assert 'results' in res.data
    assert 'count' in res.data
    assert res.data['count'] == 3
    assert len(res.data['results']) == 3


def test_following_endpoint_is_paginated(api_client, user_factory):
    follower_user = user_factory(username='follower1')
    for i in range(3):
        target = user_factory(username=f'target{i}')
        Follow.objects.create(follower=follower_user, following=target)

    res = api_client.get(f'/api/users/{follower_user.username}/following/')
    assert res.status_code == 200
    assert res.data['count'] == 3


def test_followers_nested_users_are_lean_summary_shape(api_client, user_factory):
    """FollowSerializer.follower/.following are UserSummarySerializer now —
    C6's fix was pairing pagination with dropping the doubly-nested full
    UserSerializer (8 queries/row) for this lean shape (0 extra queries/row)."""
    target = user_factory(username='popular2')
    follower = user_factory(username='fan_lean')
    Follow.objects.create(follower=follower, following=target)

    res = api_client.get(f'/api/users/{target.username}/followers/')
    entry = res.data['results'][0]
    assert set(entry['follower'].keys()) == {'id', 'username', 'profile_picture'}
    assert set(entry['following'].keys()) == {'id', 'username', 'profile_picture'}


def test_followers_query_count_is_bounded(django_assert_max_num_queries, api_client, user_factory):
    """Regression guard: 10 followers should cost a small, count-independent
    number of queries (was 8/row — 80 queries for 10 followers — before
    select_related + UserSummarySerializer)."""
    target = user_factory(username='popular3')
    for i in range(10):
        follower = user_factory(username=f'fan_bulk{i}')
        Follow.objects.create(follower=follower, following=target)

    with django_assert_max_num_queries(6):
        res = api_client.get(f'/api/users/{target.username}/followers/')
        assert res.status_code == 200
        assert res.data['count'] == 10
