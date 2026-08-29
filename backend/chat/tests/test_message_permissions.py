import pytest
from chat.models import Conversation, Message

pytestmark = pytest.mark.django_db


def make_conversation(user_a, user_b):
    conv = Conversation.objects.create()
    conv.participants.add(user_a, user_b)
    return conv


# MessageViewSet.get_queryset only checked "am I a participant in this
# message's conversation", not "did I send this message" — with no
# object-level ownership check, EITHER participant could PATCH/DELETE the
# OTHER party's messages (a real IDOR, closed by adding IsOwnerOrReadOnly
# with owner_field='sender').

def test_participant_cannot_edit_the_other_participants_message(auth_client, user_factory):
    other = user_factory(username='sender1')
    conv = make_conversation(auth_client.user, other)
    message = Message.objects.create(conversation=conv, sender=other, content='original')

    res = auth_client.patch(f'/api/messages/{message.id}/', {'content': 'tampered'})
    assert res.status_code in (403, 404)

    message.refresh_from_db()
    assert message.content == 'original'


def test_participant_cannot_delete_the_other_participants_message(auth_client, user_factory):
    other = user_factory(username='sender2')
    conv = make_conversation(auth_client.user, other)
    message = Message.objects.create(conversation=conv, sender=other, content='dont delete me')

    res = auth_client.delete(f'/api/messages/{message.id}/')
    assert res.status_code in (403, 404)
    assert Message.objects.filter(id=message.id).exists()


def test_sender_can_edit_own_message(auth_client, user_factory):
    other = user_factory(username='sender3')
    conv = make_conversation(auth_client.user, other)
    message = Message.objects.create(conversation=conv, sender=auth_client.user, content='original')

    res = auth_client.patch(f'/api/messages/{message.id}/', {'content': 'edited'})
    assert res.status_code == 200

    message.refresh_from_db()
    assert message.content == 'edited'


def test_receiver_can_still_mark_read_despite_not_owning_the_message(auth_client, user_factory):
    """mark_read is the one case where the NON-sender must be able to write
    to a message they don't own — it deliberately overrides the viewset's
    IsOwnerOrReadOnly back to plain IsAuthenticated and enforces its own,
    inverse rule in the body (sender may not mark their own message read).
    Regression guard: closing the IDOR above must not also break this."""
    other = user_factory(username='sender4')
    conv = make_conversation(auth_client.user, other)
    message = Message.objects.create(conversation=conv, sender=other, content='hi', is_read=False)

    res = auth_client.patch(f'/api/messages/{message.id}/mark_read/')
    assert res.status_code == 200

    message.refresh_from_db()
    assert message.is_read is True


def test_sender_cannot_mark_own_message_read(auth_client, user_factory):
    other = user_factory(username='sender5')
    conv = make_conversation(auth_client.user, other)
    message = Message.objects.create(conversation=conv, sender=auth_client.user, content='hi', is_read=False)

    res = auth_client.patch(f'/api/messages/{message.id}/mark_read/')
    assert res.status_code == 400

    message.refresh_from_db()
    assert message.is_read is False
