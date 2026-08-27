from rest_framework import serializers
from .models import Conversation, Message
from core.serializers import UserSummarySerializer

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSummarySerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'content', 'created_at', 'is_read']
        read_only_fields = ['id', 'sender', 'created_at']


class ConversationSerializer(serializers.ModelSerializer):
    participants = UserSummarySerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'item', 'last_message', 'unread_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_last_message(self, obj):
        # ConversationViewSet annotates these via Subquery — obj.messages.last()
        # previously looked free under prefetch_related('messages') but wasn't:
        # .last() clones the queryset (same class of bug as ItemSerializer's old
        # get_is_liked), so it fired its own query per conversation anyway,
        # while the prefetch it supposedly used still paid to load every
        # message body in the conversation for nothing. Falls back to the
        # original query-based approach for any context that didn't annotate
        # (e.g. a Conversation serialized outside ConversationViewSet).
        if hasattr(obj, 'last_message_content'):
            content = obj.last_message_content
            if content is None:
                return None  # annotated, and this conversation genuinely has no messages
            return {
                'content': content,
                'created_at': obj.last_message_created_at,
                'sender': obj.last_message_sender_username,
            }
        # Not annotated — fall back to the direct (query-per-call) approach
        last_msg = obj.messages.last()
        if last_msg:
            return {
                'content': last_msg.content,
                'created_at': last_msg.created_at,
                'sender': last_msg.sender.username
            }
        return None

    def get_unread_count(self, obj):
        annotated = getattr(obj, 'unread_count_annotated', None)
        if annotated is not None:
            return annotated
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0
