from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from core.models import Like, Order, Follow
from chat.models import Message
from .models import Notification
from core.emails import (
    send_order_confirmation,
    send_new_order_notification,
    send_new_message_notification,
    send_new_follower_notification,
)

@receiver(post_save, sender=Like)
def create_like_notification(sender, instance, created, **kwargs):
    if created and instance.user != instance.item.seller:
        # Create Notification
        notification = Notification.objects.create(
            recipient=instance.item.seller,
            sender=instance.user,
            notification_type='like',
            message=f"{instance.user.username} liked your item: {instance.item.title}"
        )
        
        # Send to WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{instance.item.seller.id}",
            {
                "type": "send_notification",
                "notification": {
                    "id": notification.id,
                    "message": notification.message,
                    "type": notification.notification_type,
                    "created_at": str(notification.created_at)
                }
            }
        )

@receiver(post_save, sender=Message)
def create_message_notification(sender, instance, created, **kwargs):
    if created:
        # Determine recipient (the other person in the conversation)
        recipient = instance.conversation.participants.exclude(id=instance.sender.id).first()
        if recipient:
            # Create Notification
            notification = Notification.objects.create(
                recipient=recipient,
                sender=instance.sender,
                notification_type='message',
                message=f"New message from {instance.sender.username}"
            )

            # Send to WebSocket
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"user_{recipient.id}",
                {
                    "type": "send_notification",
                    "notification": {
                        "id": notification.id,
                        "message": notification.message,
                        "type": notification.notification_type,
                        "created_at": str(notification.created_at)
                    }
                }
            )
            
            # Send Email Notification
            send_new_message_notification(instance)

@receiver(post_save, sender=Order)
def order_created(sender, instance, created, **kwargs):
    """Send emails when order is created"""
    if created:
        # Send confirmation to buyer
        send_order_confirmation(instance)
        # Send notification to seller
        send_new_order_notification(instance)

@receiver(post_save, sender=Follow)
def follow_created(sender, instance, created, **kwargs):
    """Send email when someone follows"""
    if created:
        send_new_follower_notification(instance)
