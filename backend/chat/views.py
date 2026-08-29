from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count, OuterRef, Subquery
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from core.security import IsOwnerOrReadOnly


def _annotate_conversations(queryset, user):
    """Attach last_message_* (via Subquery) and unread_count_annotated (via
    conditional Count) to a Conversation queryset, for ConversationSerializer
    to read directly with zero extra queries. Replaces
    prefetch_related('messages') + obj.messages.last() / obj.messages.filter(...).count()
    in the serializer, which loaded every message body in every conversation
    (the prefetch) while still firing a query per conversation anyway (.last()
    and .filter() both clone the queryset, which drops the prefetch cache).

    Count(..., filter=...) rather than a second .filter() call: filtering the
    same 'messages' relation through a second call would add a second JOIN
    and multiply rows (the classic multi-annotation fan-out bug) — the
    conditional-aggregation form reuses one JOIN via a SQL CASE WHEN inside
    the COUNT instead.
    """
    latest_message = Message.objects.filter(conversation=OuterRef('pk')).order_by('-created_at')
    return queryset.annotate(
        last_message_content=Subquery(latest_message.values('content')[:1]),
        last_message_created_at=Subquery(latest_message.values('created_at')[:1]),
        last_message_sender_username=Subquery(latest_message.values('sender__username')[:1]),
        unread_count_annotated=Count(
            'messages', filter=Q(messages__is_read=False) & ~Q(messages__sender=user)
        ),
    )


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Conversation.objects.filter(
            participants=self.request.user
        ).prefetch_related('participants')
        return _annotate_conversations(qs, self.request.user)

    def create(self, request, *args, **kwargs):
        """Create a new conversation"""
        other_user_id = request.data.get('other_user')
        item_id = request.data.get('item')

        if not other_user_id:
            return Response(
                {'error': 'other_user is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if conversation already exists
        existing = Conversation.objects.filter(
            participants=request.user
        ).filter(
            participants__id=other_user_id
        )

        if item_id:
            existing = existing.filter(item_id=item_id)

        if existing.exists():
            conversation = _annotate_conversations(existing, request.user).first()
            serializer = self.get_serializer(conversation)
            return Response(serializer.data)

        # Create new conversation
        conversation = Conversation.objects.create()
        if item_id:
            conversation.item_id = item_id
            conversation.save()

        conversation.participants.add(request.user, other_user_id)

        # Re-fetch through the same annotated path used everywhere else, so
        # the response shape (last_message/unread_count) is consistent
        # regardless of which branch created/found the conversation.
        conversation = _annotate_conversations(
            Conversation.objects.filter(pk=conversation.pk), request.user
        ).get()
        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get all messages in a conversation"""
        conversation = self.get_object()
        messages = conversation.messages.all().select_related('sender')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    # get_queryset only scopes to "am I a participant in this conversation",
    # not "did I send this message" — with no object-level ownership check,
    # either participant could PATCH/DELETE the OTHER party's messages (a
    # real IDOR). IsOwnerOrReadOnly closes that for the standard
    # update/partial_update/destroy actions; mark_read below deliberately
    # overrides this back to plain IsAuthenticated, since that action's
    # whole point is letting the non-sender (the receiver) write to a
    # message they don't own — it already enforces the correct, inverse
    # rule itself (sender may NOT mark their own message read).
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    owner_field = 'sender'

    def get_queryset(self):
        return Message.objects.filter(
            conversation__participants=self.request.user
        ).select_related('sender', 'conversation')

    def create(self, request, *args, **kwargs):
        """Send a new message"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Verify user is part of the conversation
        conversation_id = request.data.get('conversation')
        try:
            conversation = Conversation.objects.get(
                id=conversation_id,
                participants=request.user
            )
        except Conversation.DoesNotExist:
            return Response(
                {'error': 'Conversation not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Create message
        message = serializer.save(sender=request.user)

        return Response(
            MessageSerializer(message).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def mark_read(self, request, pk=None):
        """Mark a message as read"""
        message = self.get_object()

        # Only the receiver can mark as read
        if message.sender == request.user:
            return Response(
                {'error': 'Cannot mark your own message as read'},
                status=status.HTTP_400_BAD_REQUEST
            )

        message.is_read = True
        message.save()

        return Response({'status': 'marked as read'})
