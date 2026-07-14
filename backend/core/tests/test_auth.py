import pytest
from django.contrib.auth import get_user_model

User = get_user_model()
pytestmark = pytest.mark.django_db


def test_register_returns_tokens(api_client):
    res = api_client.post('/api/register/', {
        'username': 'newbie', 'password': 'sup3rsecret', 'email': 'newbie@example.com',
    })
    assert res.status_code == 201
    assert res.data['access']
    assert res.data['refresh']
    assert User.objects.filter(username='newbie').exists()


def test_register_rejects_duplicate_username(api_client, user_factory):
    user_factory(username='taken')
    res = api_client.post('/api/register/', {'username': 'taken', 'password': 'x123456'})
    assert res.status_code == 400


def test_token_obtain(api_client, user_factory):
    user_factory(username='loginuser', password='knownpass1')
    res = api_client.post('/api/token/', {'username': 'loginuser', 'password': 'knownpass1'})
    assert res.status_code == 200
    assert res.data['access']
