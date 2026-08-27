from django.db import models
from django.conf import settings

class Conversation(models.Model):
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='conversations')
    item = models.ForeignKey('core.Item', on_delete=models.SET_NULL, null=True, blank=True, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            # ConversationViewSet.get_queryset: filter(participants=user) (via
            # the M2M through table, already indexed) ordered by Meta.ordering.
            models.Index(fields=['-updated_at'], name='chat_conversation_updated_idx'),
        ]

    def __str__(self):
        return f"Conversation {self.id}"


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']
        indexes = [
            # conversation.messages.all() (ConversationViewSet.messages action)
            # and the last-message Subquery, both ordered within a conversation.
            models.Index(fields=['conversation', 'created_at'], name='chat_message_conv_created_idx'),
            # get_unread_count's Count(filter=Q(is_read=False) & ~Q(sender=...))
            # is always scoped to one conversation via the outer join — a
            # composite serves that better than a bare is_read index would
            # (low-cardinality boolean columns index poorly on their own).
            models.Index(fields=['conversation', 'is_read'], name='chat_message_conv_is_read_idx'),
        ]

    def __str__(self):
        return f"Message from {self.sender.username} at {self.created_at}"
