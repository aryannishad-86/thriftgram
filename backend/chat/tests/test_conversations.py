import pytest
from chat.models import Conversation, Message

pytestmark = pytest.mark.django_db


def make_conversation(user_a, user_b):
    conv = Conversation.objects.create()
    conv.participants.add(user_a, user_b)
    return conv


def test_last_message_reflects_most_recent_via_annotation(auth_client, user_factory):
    """ConversationViewSet annotates last_message_* via Subquery, replacing
    obj.messages.last() (which cloned the queryset and defeated
    prefetch_related('messages') anyway). Correctness check: with multiple
    messages, the annotation must return the actual most recent one, not the
    first or an arbitrary one."""
    other = user_factory(username='other1')
    conv = make_conversation(auth_client.user, other)
    Message.objects.create(conversation=conv, sender=auth_client.user, content='first')
    Message.objects.create(conversation=conv, sender=other, content='second')
    latest = Message.objects.create(conversation=conv, sender=auth_client.user, content='third and latest')

    res = auth_client.get('/api/conversations/')
    assert res.status_code == 200
    data = res.data['results'][0]
    assert data['last_message']['content'] == 'third and latest'
    assert data['last_message']['sender'] == auth_client.user.username


def test_last_message_is_none_for_empty_conversation(auth_client, user_factory):
    other = user_factory(username='other2')
    make_conversation(auth_client.user, other)

    res = auth_client.get('/api/conversations/')
    assert res.data['results'][0]['last_message'] is None


def test_unread_count_excludes_own_messages(auth_client, user_factory):
    """get_unread_count must only count unread messages from the OTHER
    participant — a user's own unread-by-recipient messages shouldn't
    inflate their own unread badge."""
    other = user_factory(username='other3')
    conv = make_conversation(auth_client.user, other)
    Message.objects.create(conversation=conv, sender=auth_client.user, content='mine, unread by them', is_read=False)
    Message.objects.create(conversation=conv, sender=other, content='theirs, unread by me', is_read=False)
    Message.objects.create(conversation=conv, sender=other, content='theirs, already read', is_read=True)

    res = auth_client.get('/api/conversations/')
    assert res.data['results'][0]['unread_count'] == 1


def test_create_conversation_returns_existing_one(auth_client, user_factory):
    other = user_factory(username='other4')
    res1 = auth_client.post('/api/conversations/', {'other_user': other.id}, format='json')
    assert res1.status_code == 201
    conv_id = res1.data['id']

    res2 = auth_client.post('/api/conversations/', {'other_user': other.id}, format='json')
    assert res2.status_code == 200
    assert res2.data['id'] == conv_id
    assert Conversation.objects.filter(participants=auth_client.user).filter(participants=other).count() == 1


def test_create_conversation_response_has_annotated_shape(auth_client, user_factory):
    """Both branches of create() (existing vs newly-created) go through the
    same _annotate_conversations path — response shape must match list()'s."""
    other = user_factory(username='other5')
    res = auth_client.post('/api/conversations/', {'other_user': other.id}, format='json')
    assert res.status_code == 201
    assert res.data['last_message'] is None
    assert res.data['unread_count'] == 0
    assert set(res.data['participants'][0].keys()) == {'id', 'username', 'profile_picture'}


def test_conversation_list_query_count_is_bounded(django_assert_max_num_queries, auth_client, user_factory):
    """Regression guard: 5 conversations, each with a few messages, should
    cost a small, count-independent number of queries — not one that scales
    with conversation or message count (the old prefetch_related('messages')
    loaded every message body across every conversation)."""
    for i in range(5):
        other = user_factory(username=f'chatpartner{i}')
        conv = make_conversation(auth_client.user, other)
        for j in range(3):
            Message.objects.create(conversation=conv, sender=other, content=f'msg{j}')

    with django_assert_max_num_queries(6):
        res = auth_client.get('/api/conversations/')
        assert res.status_code == 200
        assert len(res.data['results']) == 5


def test_message_sender_is_lean_summary_shape(auth_client, user_factory):
    other = user_factory(username='other6')
    conv = make_conversation(auth_client.user, other)
    Message.objects.create(conversation=conv, sender=other, content='hi')

    res = auth_client.get(f'/api/conversations/{conv.id}/messages/')
    assert res.status_code == 200
    assert set(res.data[0]['sender'].keys()) == {'id', 'username', 'profile_picture'}
