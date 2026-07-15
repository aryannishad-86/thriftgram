from django.db.models.signals import post_save
from django.dispatch import receiver
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
        Notification.objects.create(
            recipient=instance.item.seller,
            sender=instance.user,
            notification_type='like',
            message=f"{instance.user.username} liked your item: {instance.item.title}"
        )

@receiver(post_save, sender=Message)
def create_message_notification(sender, instance, created, **kwargs):
    if created:
        # Determine recipient (the other person in the conversation)
        recipient = instance.conversation.participants.exclude(id=instance.sender.id).first()
        if recipient:
            Notification.objects.create(
                recipient=recipient,
                sender=instance.sender,
                notification_type='message',
                message=f"New message from {instance.sender.username}"
            )
            send_new_message_notification(instance)

@receiver(post_save, sender=Order)
def order_paid(sender, instance, created, **kwargs):
    """Send order emails only once the order is actually PAID — never on the
    PENDING order created at checkout. Relies on _old_status set by the pre_save
    hook in core.signals.capture_old_order_status."""
    old_status = getattr(instance, '_old_status', None)
    if instance.status == 'PAID' and old_status != 'PAID':
        send_order_confirmation(instance)     # to buyer
        send_new_order_notification(instance)  # to seller

@receiver(post_save, sender=Follow)
def follow_created(sender, instance, created, **kwargs):
    """Send email when someone follows"""
    if created:
        send_new_follower_notification(instance)
