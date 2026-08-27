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


def test_register_rejects_weak_password(api_client):
    """AUTH_PASSWORD_VALIDATORS was configured in settings but create_user()
    never actually called validate_password — a 1-character password was
    previously accepted (201) despite MinimumLengthValidator etc. being 'on'."""
    res = api_client.post('/api/register/', {
        'username': 'weakpw', 'password': 'a', 'email': 'weakpw@example.com',
    })
    assert res.status_code == 400
    assert 'error' in res.data
    assert not User.objects.filter(username='weakpw').exists()


def test_register_rejects_password_too_similar_to_username(api_client):
    """validate_password is called with an unsaved User carrying the submitted
    username/email so UserAttributeSimilarityValidator can actually compare —
    passing a bare string would skip this validator entirely."""
    res = api_client.post('/api/register/', {
        'username': 'similaruser', 'password': 'similaruser123', 'email': 'similaruser@example.com',
    })
    assert res.status_code == 400
    assert not User.objects.filter(username='similaruser').exists()


def test_register_rejects_common_password(api_client):
    res = api_client.post('/api/register/', {
        'username': 'commonpw', 'password': 'password123', 'email': 'commonpw@example.com',
    })
    assert res.status_code == 400
    assert not User.objects.filter(username='commonpw').exists()


def test_login_view_is_throttled():
    """Regression test for H6: LoginRateThrottle (5/min) was defined and
    wired to GoogleLogin, but the actual password-login path (/api/token/,
    the one brute-force targets) had no throttle beyond the generic 100/hr
    anon bucket. settings.DEFAULT_THROTTLE_RATES['login'] is None in tests
    (see test_settings.py) so hammering the endpoint wouldn't catch a
    regression on its own — assert directly on the view's declared throttle
    classes instead, matching the pattern used for stripe_webhook in P1."""
    from core.views import ThrottledTokenObtainPairView
    from core.security import LoginRateThrottle
    assert ThrottledTokenObtainPairView.throttle_classes == [LoginRateThrottle]


class TestLogout:
    """C4: logout was previously 100% client-side (localStorage.removeItem,
    no request at all) — a copied/leaked refresh token stayed valid for its
    full lifetime no matter what the original owner did."""

    def test_logout_blacklists_refresh_token(self, api_client, user_factory):
        user = user_factory(username='logoutuser', password='knownpass1')
        login = api_client.post('/api/token/', {'username': 'logoutuser', 'password': 'knownpass1'})
        access, refresh = login.data['access'], login.data['refresh']

        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        logout_res = api_client.post('/api/logout/', {'refresh': refresh})
        assert logout_res.status_code == 200

        # The blacklisted refresh token must no longer mint new access tokens —
        # before this fix, logout didn't touch the token at all and it stayed
        # valid until its natural 7-day expiry.
        api_client.credentials()  # refresh endpoint doesn't need auth
        refresh_res = api_client.post('/api/token/refresh/', {'refresh': refresh})
        assert refresh_res.status_code == 401

    def test_logout_requires_authentication(self, api_client):
        res = api_client.post('/api/logout/', {'refresh': 'whatever'})
        assert res.status_code == 401

    def test_logout_without_refresh_token_is_400(self, api_client, user_factory):
        user_factory(username='norefresh', password='knownpass1')
        login = api_client.post('/api/token/', {'username': 'norefresh', 'password': 'knownpass1'})
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {login.data["access"]}')
        res = api_client.post('/api/logout/', {})
        assert res.status_code == 400

    def test_logout_with_garbage_token_is_idempotent(self, api_client, user_factory):
        """An already-expired/invalid/blacklisted token still results in the
        caller ending up logged out from their own point of view — logout
        shouldn't 500 or error out just because the token was already dead."""
        user_factory(username='garbagelogout', password='knownpass1')
        login = api_client.post('/api/token/', {'username': 'garbagelogout', 'password': 'knownpass1'})
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {login.data["access"]}')
        res = api_client.post('/api/logout/', {'refresh': 'not-a-real-token'})
        assert res.status_code == 200
