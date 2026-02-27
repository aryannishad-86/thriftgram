import os
from django.shortcuts import render, get_object_or_404
from django.db.models import Q
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import get_user_model
from .models import Item, Like, ClosetItem, DropEvent, Follow, Order, Review, Wishlist
from .serializers import (
    ItemSerializer, UserSerializer, UserProfileSerializer, ClosetItemSerializer,
    DropEventSerializer, FollowSerializer, OrderSerializer, ReviewSerializer, WishlistSerializer
)
from .ai_service import AIService
from .eco_service import EcoService

User = get_user_model()

from rest_framework.views import APIView
from .security import LoginRateThrottle, RegisterRateThrottle

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [RegisterRateThrottle]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')

        if not username or not password:
            return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, password=password, email=email)
        
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'User created successfully',
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)

class LeaderboardViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all().order_by('-eco_points')
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    def list(self, request, *args, **kwargs):
        # Return top 10 users
        queryset = self.get_queryset()[:10]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class ClosetItemViewSet(viewsets.ModelViewSet):
    serializer_class = ClosetItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        return ClosetItem.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class DropEventViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DropEvent.objects.filter(is_active=True).order_by('start_time')
    serializer_class = DropEventSerializer
    permission_classes = [permissions.AllowAny]

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    lookup_field = 'username'

    @action(detail=False, methods=['get', 'patch'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """Get or update current user profile"""
        if request.method == 'GET':
            serializer = self.get_serializer(request.user, context={'request': request})
            return Response(serializer.data)
        elif request.method == 'PATCH':
            serializer = UserProfileSerializer(request.user, data=request.data, partial=True, context={'request': request})
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def follow(self, request, username=None):
        """Follow a user"""
        user_to_follow = self.get_object()
        if user_to_follow == request.user:
            return Response({'error': 'Cannot follow yourself'}, status=status.HTTP_400_BAD_REQUEST)
        
        follow, created = Follow.objects.get_or_create(
            follower=request.user,
            following=user_to_follow
        )
        
        if created:
            return Response({'status': 'following'}, status=status.HTTP_201_CREATED)
        return Response({'status': 'already following'})

    @action(detail=True, methods=['delete'], permission_classes=[permissions.IsAuthenticated])
    def unfollow(self, request, username=None):
        """Unfollow a user"""
        user_to_unfollow = self.get_object()
        deleted_count, _ = Follow.objects.filter(
            follower=request.user,
            following=user_to_unfollow
        ).delete()
        
        if deleted_count > 0:
            return Response({'status': 'unfollowed'}, status=status.HTTP_200_OK)
        return Response({'status': 'not following'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def followers(self, request, username=None):
        """Get user's followers"""
        user = self.get_object()
        followers = Follow.objects.filter(following=user)
        serializer = FollowSerializer(followers, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def following(self, request, username=None):
        """Get users that this user follows"""
        user = self.get_object()
        following = Follow.objects.filter(follower=user)
        serializer = FollowSerializer(following, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def dashboard_stats(self, request):
        user = request.user
        total_listings = Item.objects.filter(seller=user).count()
        total_likes = Like.objects.filter(item__seller=user).count()
        
        return Response({
            'username': user.username,
            'total_listings': total_listings,
            'total_likes': total_likes,
            'total_sales': 0, # Placeholder
        })

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAdminUser])
    def debug_config(self, request):
        from django.conf import settings
        import os
        
        cloudinary_url = os.getenv('CLOUDINARY_URL', '')
        masked_url = cloudinary_url[:15] + '...' if cloudinary_url else 'Not Set'
        
        storage_conf = getattr(settings, 'CLOUDINARY_STORAGE', None)
        masked_conf = {k: '***' for k in storage_conf.keys()} if storage_conf else 'Not Set'
        
        return Response({
            'DEFAULT_FILE_STORAGE': getattr(settings, 'DEFAULT_FILE_STORAGE', 'Not Set'),
            'CLOUDINARY_URL': masked_url,
            'CLOUDINARY_STORAGE': masked_conf,
            'MEDIA_ROOT': str(settings.MEDIA_ROOT),
            'MEDIA_URL': settings.MEDIA_URL,
        })

class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all().select_related('seller').prefetch_related(
        'images', 'likes', 'reviews'
    ).order_by('-created_at')
    serializer_class = ItemSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description']

    def get_queryset(self):
        queryset = Item.objects.all().select_related('seller').prefetch_related(
            'images', 'likes', 'reviews'
        ).order_by('-created_at')
        seller_username = self.request.query_params.get('seller_username', None)
        if seller_username is not None:
            queryset = queryset.filter(seller__username=seller_username)
        return queryset

    def perform_create(self, serializer):
        item = serializer.save(seller=self.request.user)
        # Award points for listing an item (encouraging circular economy)
        EcoService.award_points(self.request.user, action_type='list')

    @action(detail=True, methods=['post'])
    def analyze(self, request, pk=None):
        item = self.get_object()
        
        # Use the first image for analysis
        if not item.images.exists():
            return Response({'error': 'Item has no images to analyze'}, status=status.HTTP_400_BAD_REQUEST)
            
        image_url = item.images.first().image.url
        analysis_result = AIService.analyze_image(image_url)
        
        item.ai_analysis = analysis_result
        item.save()
        
        return Response(analysis_result)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def match_outfit(self, request, pk=None):
        """
        Suggests items from the user's closet that match this item.
        """
        item = self.get_object()
        user_closet = ClosetItem.objects.filter(user=request.user)
        
        from .wardrobe_service import WardrobeService # Import here to avoid circular dependency if any
        
        matches = WardrobeService.generate_outfit(item, user_closet)
        serializer = ClosetItemSerializer(matches, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def featured(self, request):
        """Return featured items for the homepage gallery"""
        items = Item.objects.filter(is_sold=False).select_related('seller').prefetch_related(
            'images', 'likes', 'reviews'
        ).order_by('-created_at')[:12]
        serializer = self.get_serializer(items, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        item = self.get_object()
        like, created = Like.objects.get_or_create(user=request.user, item=item)
        if not created:
            return Response({'detail': 'You already liked this item.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'detail': 'Item liked.'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def unlike(self, request, pk=None):
        item = self.get_object()
        Like.objects.filter(user=request.user, item=item).delete()
        return Response({'detail': 'Item unliked.'}, status=status.HTTP_204_NO_CONTENT)

from rest_framework_simplejwt.tokens import RefreshToken
import requests

class GoogleLogin(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        access_token = request.data.get('access_token')
        
        if not access_token:
            return Response({'error': 'access_token is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Verify the Google access token
            google_response = requests.get(
                'https://www.googleapis.com/oauth2/v1/userinfo',
                headers={'Authorization': f'Bearer {access_token}'}
            )
            
            if google_response.status_code != 200:
                return Response({'error': 'Invalid Google access token'}, status=status.HTTP_400_BAD_REQUEST)
            
            google_data = google_response.json()
            email = google_data.get('email')
            name = google_data.get('name', '')
            
            if not email:
                return Response({'error': 'Email not provided by Google'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Get or create user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0],  # Use email prefix as username
                    'first_name': name.split()[0] if name else '',
                    'last_name': ' '.join(name.split()[1:]) if len(name.split()) > 1 else '',
                }
            )
            
            # If username already exists, append a number
            if created and User.objects.filter(username=user.username).exclude(id=user.id).exists():
                base_username = user.username
                counter = 1
                while User.objects.filter(username=f"{base_username}{counter}").exists():
                    counter += 1
                user.username = f"{base_username}{counter}"
                user.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Phase 1 ViewSets

class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return orders where user is buyer or seller"""
        return Order.objects.filter(
            Q(buyer=self.request.user) | Q(item__seller=self.request.user)
        )
    
    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def update_status(self, request, pk=None):
        """Update order status (seller only)"""
        order = self.get_object()
        if order.item.seller != request.user:
            return Response(
                {'error': 'Only seller can update status'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        new_status = request.data.get('status')
        if new_status in dict(Order.STATUS_CHOICES):
            order.status = new_status
            order.save()
            serializer = self.get_serializer(order)
            return Response(serializer.data)
        return Response(
            {'error': 'Invalid status'},
            status=status.HTTP_400_BAD_REQUEST
        )


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        item_id = self.request.query_params.get('item')
        if item_id:
            return Review.objects.filter(item_id=item_id)
        return Review.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)


class WishlistViewSet(viewsets.ModelViewSet):
    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user)
    
    def create(self, request):
        item_id = request.data.get('item')
        if not item_id:
            return Response({'error': 'item ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            item = Item.objects.get(id=item_id)
        except Item.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
        
        wishlist, created = Wishlist.objects.get_or_create(
            user=request.user,
            item=item
        )
        
        if created:
            serializer = self.get_serializer(wishlist)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response({'status': 'already in wishlist'})
    
    @action(detail=False, methods=['delete'], permission_classes=[permissions.IsAuthenticated])
    def remove(self, request):
        """Remove item from wishlist"""
        item_id = request.data.get('item')
        if not item_id:
            return Response({'error': 'item ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        deleted_count, _ = Wishlist.objects.filter(
            user=request.user,
            item_id=item_id
        ).delete()
        
        if deleted_count > 0:
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({'error': 'Item not in wishlist'}, status=status.HTTP_404_NOT_FOUND)


from rest_framework.decorators import api_view, permission_classes
from .models import EcoPointsHistory
from .serializers import EcoPointsHistorySerializer

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def eco_points_history(request):
    """Get authenticated user's eco points history"""
    history = EcoPointsHistory.objects.filter(
        user=request.user
    ).order_by('-created_at')[:50]
    serializer = EcoPointsHistorySerializer(history, many=True)
    return Response(serializer.data)


from rest_framework.decorators import api_view, permission_classes
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from .stripe_service import StripeService
import stripe

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_checkout_session(request):
    """Create Stripe checkout session for item purchase"""
    item_id = request.data.get('item_id')
    item = get_object_or_404(Item, id=item_id)
    
    # Prevent buying own items
    if item.seller == request.user:
        return Response(
            {'error': 'Cannot purchase your own item'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Prevent buying already sold items
    if item.is_sold:
        return Response(
            {'error': 'This item has already been sold'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create checkout session
    frontend_url = settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else 'http://localhost:3000'
    success_url = f"{frontend_url}/orders?success=true&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{frontend_url}/items/{item_id}"
    
    try:
        session = StripeService.create_checkout_session(
            item, success_url, cancel_url
        )
        
        # Create pending order - use session.id if payment_intent is not yet available
        Order.objects.create(
            buyer=request.user,
            item=item,
            status='PENDING',
            stripe_payment_intent=session.payment_intent or session.id,
            total_amount=item.price
        )
        
        return Response({'sessionId': session.id, 'url': session.url})
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@csrf_exempt
def stripe_webhook(request):
    """Handle Stripe webhooks"""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    if not sig_header:
        return Response({'error': 'Missing signature'}, status=400)
    
    try:
        webhook_secret = settings.STRIPE_WEBHOOK_SECRET
        event = StripeService.construct_webhook_event(
            payload, sig_header, webhook_secret
        )
    except ValueError as e:
        return Response({'error': 'Invalid payload'}, status=400)
    except stripe.error.SignatureVerificationError as e:
        return Response({'error': 'Invalid signature'}, status=400)
    
    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        handle_checkout_completion(session)
    elif event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        # Handle successful payment intent if needed
        pass
    
    return Response({'status': 'success'})


def handle_checkout_completion(session):
    """Handle successful checkout session completion"""
    try:
        item_id = session['metadata'].get('item_id')
        if not item_id:
            return
        
        # Get payment intent ID
        payment_intent_id = session.get('payment_intent') or session.get('id')
        
        # Find and update order
        try:
            order = Order.objects.get(stripe_payment_intent=payment_intent_id)
            order.status = 'PAID'
            order.save()
            
            # Mark item as sold
            item = Item.objects.get(id=item_id)
            item.is_sold = True
            item.save()
            
            # Award eco points to buyer (+20)
            buyer = order.buyer
            buyer.eco_points += 20
            buyer.items_bought_count += 1
            buyer.save()
            
            # Update buyer's tier
            buyer.update_tier()
            
            # Create eco points history
            from .models import EcoPointsHistory
            EcoPointsHistory.objects.create(
                user=buyer,
                action='ITEM_PURCHASED',
                points=20,
                description=f'Purchased "{item.title}"'
            )
            
            # TODO: Create notification for seller
            # TODO: Send confirmation email to buyer
            
        except Order.DoesNotExist:
            # Order not found, log error
            pass
            
    except Exception as e:
        # Log error
        print(f"Error handling checkout completion: {str(e)}")
