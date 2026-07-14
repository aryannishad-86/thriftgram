import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user_factory(db):
    counter = {'n': 0}

    def make(username=None, password='pass12345', **kwargs):
        counter['n'] += 1
        username = username or f'user{counter["n"]}'
        email = kwargs.pop('email', f'{username}@example.com')
        return User.objects.create_user(username=username, password=password, email=email, **kwargs)

    return make


@pytest.fixture
def auth_client(api_client, user_factory):
    """An APIClient authenticated as a fresh user, exposed at client.user."""
    user = user_factory(username='authuser')
    api_client.force_authenticate(user=user)
    api_client.user = user
    return api_client


@pytest.fixture
def item_factory(db, user_factory):
    from core.models import Item

    def make(seller=None, **kwargs):
        seller = seller or user_factory()
        defaults = dict(title='Vintage Tee', description='A nice tee',
                        price='500.00', size='M', condition='GOOD')
        defaults.update(kwargs)
        return Item.objects.create(seller=seller, **defaults)

    return make
