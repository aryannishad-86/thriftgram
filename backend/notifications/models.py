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

    def __str__(self):
        return f"{self.sender} -> {self.recipient}: {self.notification_type}"
