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
