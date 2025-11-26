from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import get_user_model
from .models import Item, Like, ClosetItem, DropEvent
from .serializers import ItemSerializer, UserSerializer, UserProfileSerializer, ClosetItemSerializer, DropEventSerializer
from .ai_service import AIService
from .eco_service import EcoService

User = get_user_model()

from rest_framework.views import APIView

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')

        if not username or not password:
            return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, password=password, email=email)
        return Response({'message': 'User created successfully'}, status=status.HTTP_201_CREATED)

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

class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all().order_by('-created_at')
    serializer_class = ItemSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description']

    def get_queryset(self):
        queryset = Item.objects.all().order_by('-created_at')
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
