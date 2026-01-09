import stripe
from django.conf import settings

stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeService:
    """Service for handling Stripe payment operations"""
    
    @staticmethod
    def create_payment_intent(amount, item_id, buyer_email):
        """
        Create a payment intent for item purchase
        
        Args:
            amount: Payment amount in dollars
            item_id: ID of the item being purchased
            buyer_email: Email of the buyer
            
        Returns:
            Stripe PaymentIntent object
        """
        intent = stripe.PaymentIntent.create(
            amount=int(amount * 100),  # Convert dollars to cents
            currency='usd',
            metadata={
                'item_id': str(item_id),
            },
            receipt_email=buyer_email,
        )
        return intent
    
    @staticmethod
    def create_checkout_session(item, success_url, cancel_url):
        """
        Create Stripe Checkout Session for item purchase
        
        Args:
            item: Item object being purchased
            success_url: URL to redirect after successful payment
            cancel_url: URL to redirect if payment is cancelled
            
        Returns:
            Stripe Checkout Session object
        """
        # Get first image URL or use placeholder
        image_url = None
        if item.images.exists():
            first_image = item.images.first()
            if first_image.image:
                image_url = first_image.image.url
        
        session_data = {
            'payment_method_types': ['card'],
            'line_items': [{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': item.title,
                        'description': item.description[:500] if len(item.description) > 500 else item.description,
                    },
                    'unit_amount': int(item.price * 100),  # Convert to cents
                },
                'quantity': 1,
            }],
            'mode': 'payment',
            'success_url': success_url,
            'cancel_url': cancel_url,
            'metadata': {
                'item_id': str(item.id),
            },
        }
        
        # Add image if available
        if image_url:
            session_data['line_items'][0]['price_data']['product_data']['images'] = [image_url]
        
        session = stripe.checkout.Session.create(**session_data)
        return session
    
    @staticmethod
    def retrieve_session(session_id):
        """
        Retrieve a checkout session by ID
        
        Args:
            session_id: Stripe checkout session ID
            
        Returns:
            Stripe Session object
        """
        return stripe.checkout.Session.retrieve(session_id)
    
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
