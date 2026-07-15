import stripe
from django.conf import settings

# Only set API key if it's configured
if settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeService:
    """Service for handling Stripe payment operations"""
    
    @staticmethod
    def is_configured():
        """Check if Stripe is properly configured"""
        return bool(settings.STRIPE_SECRET_KEY)
    
    @staticmethod
    def create_checkout_session(items, success_url, cancel_url):
        """
        Create a Stripe Checkout Session for one or more items.

        Args:
            items: iterable of Item objects being purchased (one line item each)
            success_url: URL to redirect after successful payment
            cancel_url: URL to redirect if payment is cancelled

        Returns:
            Stripe Checkout Session object. metadata['item_ids'] holds the
            comma-joined item ids, but the webhook resolves purchases from the
            Orders keyed to the session id rather than trusting this.
        """
        if not StripeService.is_configured():
            raise ValueError("Stripe is not configured. Please set STRIPE_SECRET_KEY.")

        line_items = []
        for item in items:
            product_data = {
                'name': item.title,
                'description': item.description[:500] if item.description else item.title,
            }
            if item.images.exists() and item.images.first().image:
                product_data['images'] = [item.images.first().image.url]
            line_items.append({
                'price_data': {
                    'currency': 'inr',
                    'product_data': product_data,
                    'unit_amount': int(item.price * 100),  # rupees → paise
                },
                'quantity': 1,
            })

        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=line_items,
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={'item_ids': ','.join(str(item.id) for item in items)},
        )
        return session

    @staticmethod
    def construct_webhook_event(payload, sig_header, webhook_secret):
        """
        Verify and construct webhook event from Stripe
        
        Args:
            payload: Request body
            sig_header: Stripe signature header
            webhook_secret: Webhook signing secret
            
        Returns:
            Stripe Event object
            
        Raises:
            ValueError, stripe.error.SignatureVerificationError
        """
        return stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
