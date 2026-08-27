import pytest

pytestmark = pytest.mark.django_db


def test_unauthenticated_error_uses_error_key(api_client):
    """DRF's default shape for this is {'detail': '...'} — custom_exception_handler
    normalizes it to {'error': '...'}, matching every hand-written view."""
    res = api_client.get('/api/orders/')
    assert res.status_code == 401
    assert 'error' in res.data
    assert 'detail' not in res.data


def test_not_found_error_uses_error_key(auth_client):
    res = auth_client.get('/api/items/999999/')
    assert res.status_code == 404
    assert 'error' in res.data
    assert 'detail' not in res.data


def test_validation_error_has_readable_message_and_field_detail(auth_client):
    """Serializer ValidationError ({'field': ['msg', ...]}) is collapsed into
    one readable 'error' string, with the original per-field breakdown kept
    under 'fields' for any future frontend work that wants it."""
    res = auth_client.post('/api/items/', {'title': ''})
    assert res.status_code == 400
    assert 'error' in res.data
    assert isinstance(res.data['error'], str)
    assert 'fields' in res.data
    assert 'title' in res.data['fields']


def test_hand_written_view_error_shape_is_untouched(api_client, user_factory):
    """Views that build and return Response({'error': ...}) directly (never
    raising an exception) don't pass through EXCEPTION_HANDLER at all —
    confirms the handler doesn't double-wrap or otherwise mutate them."""
    user_factory(username='exists_already')
    res = api_client.post('/api/register/', {'username': 'exists_already', 'password': 'whatever12345'})
    assert res.status_code == 400
    assert res.data == {'error': 'Username already exists'}


def test_successful_response_is_unaffected(api_client, item_factory):
    """The handler only runs on the error path (drf_default_exception_handler
    returns None for non-exception responses) — a normal 200 must be
    completely untouched."""
    item_factory()
    res = api_client.get('/api/items/')
    assert res.status_code == 200
    assert 'error' not in res.data
