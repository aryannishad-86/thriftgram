import pytest
from django.core.cache import cache
from core.models import Item

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def clear_cache():
    """The DatabaseCache-backed cache is process-global (not per-test-
    transaction like the DB), so an entry set by one test would otherwise
    leak into the next."""
    cache.clear()
    yield
    cache.clear()


class TestLeaderboardCaching:
    def test_second_call_is_served_from_cache(self, api_client, user_factory):
        """Correctness check for the caching mechanism itself. Changes the
        underlying data via a bulk .update() specifically — a real
        instance.save() would go through invalidate_leaderboard_cache and
        recompute correctly regardless of whether caching works at all,
        which would make this test pass for the wrong reason. .update()
        bypasses that signal, isolating "did the second call actually read
        from cache" from "did invalidation happen to fire.\""""
        from core.models import CustomUser
        user = user_factory(username='cache_check', eco_points=100)
        res1 = api_client.get('/api/leaderboard/')
        assert res1.data['results'][0]['eco_points'] == 100

        CustomUser.objects.filter(pk=user.pk).update(eco_points=9999)

        res2 = api_client.get('/api/leaderboard/')
        assert res2.data['results'][0]['eco_points'] == 100  # stale-cached, not recomputed to 9999

    def test_cache_invalidates_on_eco_points_change(self, api_client, user_factory):
        """invalidate_leaderboard_cache (core/signals.py) fires on every
        CustomUser save — item creation is one of the three real eco_points
        award paths (see core/signals.py's award_points_for_listing)."""
        seller = user_factory(username='seller_cache_test')
        api_client.get('/api/leaderboard/')  # populate the cache

        Item.objects.create(seller=seller, title='T', description='d',
                            price='10.00', size='M', condition='GOOD')  # awards 50 eco points, saves seller

        res = api_client.get('/api/leaderboard/')
        seller.refresh_from_db()
        assert seller.eco_points == 50
        assert res.data['results'][0]['eco_points'] == 50  # fresh, not stale-cached at 0

    def test_entries_have_no_personalized_fields(self, api_client, user_factory):
        """LeaderboardEntrySerializer — no is_following/followers_count/email.
        This is also what makes the caching above correct: a response with
        no per-viewer data is safe to share across every caller."""
        user_factory(username='lb_entry', eco_points=10)
        res = api_client.get('/api/leaderboard/')
        entry = res.data['results'][0]
        assert set(entry.keys()) == {'id', 'username', 'profile_picture', 'eco_points', 'co2_saved', 'water_saved'}


class TestFeaturedItemsCaching:
    def test_anonymous_second_call_is_served_from_cache(self, api_client, item_factory):
        """Isolates cache-hit behavior via a bulk .update() on a plain field
        (bypasses Item's post_save signal entirely — same reasoning as the
        leaderboard cache-hit test above) rather than creating a second item,
        which would correctly invalidate via invalidate_featured_cache and
        pass this test for the wrong reason."""
        item = item_factory(title='original title')
        res1 = api_client.get('/api/items/featured/')
        assert res1.data[0]['title'] == 'original title'

        Item.objects.filter(pk=item.pk).update(title='changed via bulk update')

        res2 = api_client.get('/api/items/featured/')
        assert res2.data[0]['title'] == 'original title'  # stale-cached, not recomputed

    def test_authenticated_requests_are_never_cached(self, auth_client, item_factory):
        """Correctness guard against the personalization leak this design
        exists to avoid: is_liked must always be live/accurate for a logged-
        in user, never served from a shared cache entry."""
        item = item_factory()
        res1 = auth_client.get('/api/items/featured/')
        assert res1.data[0]['is_liked'] is False

        auth_client.post(f'/api/items/{item.id}/like/')
        res2 = auth_client.get('/api/items/featured/')
        assert res2.data[0]['is_liked'] is True  # reflects the like immediately, not a stale cached False

    def test_cache_invalidates_on_new_item(self, api_client, item_factory):
        item_factory(title='original')
        api_client.get('/api/items/featured/')  # populate the cache

        item_factory(title='newly listed')

        res = api_client.get('/api/items/featured/')
        assert len(res.data) == 2

    def test_cache_invalidates_when_item_sells(self, api_client, auth_client, item_factory):
        """Exercises the real webhook path, not a direct .update() call —
        Item.objects.filter(...).update(is_sold=True) doesn't fire Item's
        post_save signal, which is exactly why this invalidation is an
        explicit cache.delete() at the webhook call site rather than a
        signal handler (see core/views.py's handle_checkout_completion)."""
        from core.models import Order
        item = item_factory()
        api_client.get('/api/items/featured/')  # populate the cache with the item present

        order = Order.objects.create(buyer=auth_client.user, item=item, status='PENDING',
                                     stripe_checkout_session_id='cs_cache_test', total_amount=item.price)
        from core.views import handle_checkout_completion
        handle_checkout_completion({'id': 'cs_cache_test', 'payment_status': 'paid', 'payment_intent': 'pi_cache_test'})

        res = api_client.get('/api/items/featured/')
        assert len(res.data) == 0  # sold item dropped out, not served stale from cache
