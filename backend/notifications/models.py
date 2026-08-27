from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('like', 'Like'),
        ('message', 'Message'),
        ('follow', 'Follow'),
    )

    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            # NotificationViewSet.get_queryset: filter(recipient=user), ordered
            # by Meta.ordering (-created_at) — the exact list-page pattern.
            models.Index(fields=['recipient', '-created_at'], name='notif_recipient_created_idx'),
            # mark_all_read: filter(recipient=user, is_read=False).update(...)
            models.Index(fields=['recipient', 'is_read'], name='notif_recipient_is_read_idx'),
        ]

    def __str__(self):
        return f"{self.sender} -> {self.recipient}: {self.notification_type}"
