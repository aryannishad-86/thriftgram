import pytest

pytestmark = pytest.mark.django_db


def test_user_list_does_not_leak_email(api_client, user_factory):
    user_factory(username='alice', email='alice@secret.com')
    user_factory(username='bob', email='bob@secret.com')

    res = api_client.get('/api/users/')
    assert res.status_code == 200
    items = res.data['results'] if isinstance(res.data, dict) else res.data
    assert items
    for entry in items:
        assert entry.get('email') is None
    assert 'secret.com' not in str(res.data)


def test_me_returns_own_email(auth_client):
    res = auth_client.get('/api/users/me/')
    assert res.status_code == 200
    assert res.data['email'] == auth_client.user.email


def test_retrieve_other_user_hides_email(api_client, user_factory):
    other = user_factory(username='carol', email='carol@secret.com')
    viewer = user_factory(username='viewer')
    api_client.force_authenticate(user=viewer)

    res = api_client.get(f'/api/users/{other.username}/')
    assert res.status_code == 200
    assert res.data['email'] is None


def test_anon_can_read_items(api_client, item_factory):
    item_factory()
    res = api_client.get('/api/items/')
    assert res.status_code == 200


def test_anon_cannot_create_item(api_client):
    res = api_client.post('/api/items/', {
        'title': 'X', 'description': 'Y', 'price': '10.00', 'size': 'M', 'condition': 'GOOD',
    })
    assert res.status_code in (401, 403)


# ReviewViewSet had IsAuthenticatedOrReadOnly with no object-level check at
# all — any authenticated user could PATCH/DELETE ANY review, not just their
# own (a real IDOR, closed by adding IsOwnerOrReadOnly with owner_field='reviewer').

def test_cannot_edit_other_users_review(api_client, user_factory, item_factory):
    from core.models import Review

    reviewer = user_factory(username='reviewer')
    attacker = user_factory(username='attacker')
    item = item_factory()
    review = Review.objects.create(item=item, reviewer=reviewer, rating=5, comment='Great!')

    api_client.force_authenticate(user=attacker)
    res = api_client.patch(f'/api/reviews/{review.id}/', {'comment': 'Hacked'})
    assert res.status_code in (403, 404)

    review.refresh_from_db()
    assert review.comment == 'Great!'


def test_cannot_delete_other_users_review(api_client, user_factory, item_factory):
    from core.models import Review

    reviewer = user_factory(username='reviewer2')
    attacker = user_factory(username='attacker2')
    item = item_factory()
    review = Review.objects.create(item=item, reviewer=reviewer, rating=4, comment='Good')

    api_client.force_authenticate(user=attacker)
    res = api_client.delete(f'/api/reviews/{review.id}/')
    assert res.status_code in (403, 404)
    assert Review.objects.filter(id=review.id).exists()


def test_can_edit_own_review(api_client, user_factory, item_factory):
    from core.models import Review

    reviewer = user_factory(username='reviewer3')
    item = item_factory()
    review = Review.objects.create(item=item, reviewer=reviewer, rating=3, comment='Okay')

    api_client.force_authenticate(user=reviewer)
    res = api_client.patch(f'/api/reviews/{review.id}/', {'comment': 'Actually great'})
    assert res.status_code == 200

    review.refresh_from_db()
    assert review.comment == 'Actually great'
