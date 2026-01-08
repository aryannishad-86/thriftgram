from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def send_order_confirmation(order):
    """Send order confirmation email to buyer"""
    try:
        subject = f'Order Confirmation - #{order.id} | ThriftGram'
        context = {
            'buyer_name': order.buyer.username,
            'item_title': order.item.title,
            'item_price': order.item.price,
            'seller_name': order.item.seller.username,
            'order_id': order.id,
            'order_url': f'{settings.FRONTEND_URL}/orders',
        }
        html_message = render_to_string('emails/order_confirmation.html', context)
        
        send_mail(
            subject=subject,
            message=f'Thank you for your order! Order ID: #{order.id}',  # Plain text fallback
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.buyer.email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f'Order confirmation sent to {order.buyer.email}')
    except Exception as e:
        logger.error(f'Failed to send order confirmation: {e}')


def send_new_order_notification(order):
    """Send new order notification to seller"""
    try:
        subject = f'New Order Received - #{order.id} | ThriftGram'
        context = {
            'seller_name': order.item.seller.username,
            'item_title': order.item.title,
            'item_price': order.item.price,
            'buyer_name': order.buyer.username,
            'order_id': order.id,
            'order_url': f'{settings.FRONTEND_URL}/orders',
        }
        html_message = render_to_string('emails/new_order_seller.html', context)
        
        send_mail(
            subject=subject,
            message=f'You have a new order! Order ID: #{order.id}',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.item.seller.email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f'New order notification sent to {order.item.seller.email}')
    except Exception as e:
        logger.error(f'Failed to send new order notification: {e}')


def send_new_message_notification(message):
    """Send new message notification to recipient"""
    try:
        # Get recipient (the other participant)
        recipient = message.conversation.participants.exclude(
            id=message.sender.id
        ).first()
        
        if not recipient:
            logger.warning(f'No recipient found for message {message.id}')
            return
        
        subject = f'New message from {message.sender.username} | ThriftGram'
        
        # Truncate message content for preview
        message_preview = message.content
        if len(message_preview) > 100:
            message_preview = message_preview[:100] + '...'
        
        context = {
            'recipient_name': recipient.username,
            'sender_name': message.sender.username,
            'message_content': message_preview,
            'message_url': f'{settings.FRONTEND_URL}/messages',
        }
        html_message = render_to_string('emails/new_message.html', context)
        
        send_mail(
            subject=subject,
            message=f'New message from {message.sender.username}: {message_preview}',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient.email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f'New message notification sent to {recipient.email}')
    except Exception as e:
        logger.error(f'Failed to send new message notification: {e}')


def send_new_follower_notification(follow):
    """Send new follower notification"""
    try:
        subject = f'{follow.follower.username} started following you | ThriftGram'
        context = {
            'user_name': follow.following.username,
            'follower_name': follow.follower.username,
            'profile_url': f'{settings.FRONTEND_URL}/profile/{follow.follower.username}',
        }
        html_message = render_to_string('emails/new_follower.html', context)
        
        send_mail(
            subject=subject,
            message=f'{follow.follower.username} started following you on ThriftGram!',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[follow.following.email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f'New follower notification sent to {follow.following.email}')
    except Exception as e:
        logger.error(f'Failed to send new follower notification: {e}')
