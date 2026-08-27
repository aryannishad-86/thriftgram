from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Item, ItemImage, ClosetItem, DropEvent, Follow, Order, Review, Wishlist, EcoPointsHistory

User = get_user_model()

def _owner_only_email(serializer, obj):
    """Return the email only to the authenticated owner of this profile — never
    leak other users' emails through public list/retrieve/leaderboard reads."""
    request = serializer.context.get('request')
    if request and request.user.is_authenticated and request.user.id == obj.id:
        return obj.email
    return None


class UserSummarySerializer(serializers.ModelSerializer):
    """Lean nested-user representation: id/username/avatar only. Every place a
    user is nested inside another object's serializer (item.seller,
    order.buyer, review.reviewer, message.sender, conversation.participants,
    follow.follower/.following) previously used the full UserSerializer,
    which computes followers_count/following_count/is_following via three
    separate SerializerMethodField queries EACH TIME — a feed page nesting 20
    items' sellers paid 60 queries just for that, none of which the frontend
    even reads off a nested user (verified: every nested-user TypeScript
    interface in the frontend already only expects id/username/
    profile_picture)."""
    class Meta:
        model = User
        fields = ['id', 'username', 'profile_picture']


class LeaderboardEntrySerializer(serializers.ModelSerializer):
    """Leaderboard-specific shape: exactly the fields the leaderboard page
    reads (verified against its TypeScript interface) and nothing
    per-viewer-personalized. The full UserSerializer's followers_count/
    following_count/is_following are both wasted work here (not rendered —
    a leaderboard entry has no follow button) and, worse, is_following
    specifically made this endpoint's response depend on WHO was asking,
    which would have made caching it (see LeaderboardViewSet) actively
    incorrect — one viewer's follow relationships leaking into the cached
    response every other viewer receives."""
    class Meta:
        model = User
        fields = ['id', 'username', 'profile_picture', 'eco_points', 'co2_saved', 'water_saved']


class UserSerializer(serializers.ModelSerializer):
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'bio', 'profile_picture', 'social_links',
            'eco_points', 'eco_tier', 'co2_saved', 'water_saved',
            'items_sold_count', 'items_bought_count',
            'followers_count', 'following_count', 'is_following'
        ]
        read_only_fields = ['eco_points', 'eco_tier', 'co2_saved', 'water_saved', 'items_sold_count', 'items_bought_count']

    def get_email(self, obj):
        return _owner_only_email(self, obj)

    def get_followers_count(self, obj):
        try:
            return obj.followers.count()
        except Exception:
            return 0
    
    def get_following_count(self, obj):
        try:
            return obj.following.count()
        except Exception:
            return 0
    
    def get_is_following(self, obj):
        try:
            request = self.context.get('request')
            if request and request.user.is_authenticated:
                return Follow.objects.filter(follower=request.user, following=obj).exists()
            return False
        except Exception:
            return False

class UserProfileSerializer(serializers.ModelSerializer):
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'bio', 'profile_picture', 'social_links',
            'date_joined', 'eco_points', 'eco_tier', 'co2_saved', 'water_saved',
            'items_sold_count', 'items_bought_count',
            'followers_count', 'following_count'
        ]
        read_only_fields = ['username', 'date_joined', 'eco_points', 'eco_tier', 'co2_saved', 'water_saved', 'items_sold_count', 'items_bought_count']

    def get_email(self, obj):
        return _owner_only_email(self, obj)

    def get_followers_count(self, obj):
        try:
            return obj.followers.count()
        except Exception:
            return 0
    
    def get_following_count(self, obj):
        try:
            return obj.following.count()
        except Exception:
            return 0

class ItemImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemImage
        fields = ['id', 'image']

class ClosetItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClosetItem
        fields = ['id', 'image', 'category', 'color', 'is_private', 'created_at']
        read_only_fields = ['created_at']

class DropEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = DropEvent
        fields = ['id', 'title', 'description', 'start_time', 'end_time', 'is_active', 'image', 'items']
        read_only_fields = ['created_at']

class ItemSerializer(serializers.ModelSerializer):
    seller = UserSummarySerializer(read_only=True)
    images = ItemImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(max_length=1000000, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False
    )
    likes_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = [
            'id', 'seller', 'title', 'description', 'price', 'size', 'condition',
            'images', 'uploaded_images', 'likes_count', 'is_liked',
            'average_rating', 'reviews_count', 'created_at', 'ai_analysis', 'is_sold'
        ]
        read_only_fields = ['seller', 'created_at', 'ai_analysis']

    def get_likes_count(self, obj):
        try:
            return obj.likes.count()
        except Exception:
            return 0

    def get_is_liked(self, obj):
        # ItemViewSet's queryset annotates is_liked_annotated via Exists() —
        # zero extra queries, and (unlike the .filter() this replaces) it
        # doesn't defeat prefetch_related('likes') for get_likes_count below.
        # Fallback query path kept for any context that serializes an Item
        # without going through that annotated queryset (e.g. nested inside
        # OrderSerializer/WishlistSerializer).
        annotated = getattr(obj, 'is_liked_annotated', None)
        if annotated is not None:
            return annotated
        try:
            request = self.context.get('request')
            if request and request.user.is_authenticated:
                return obj.likes.filter(user=request.user).exists()
            return False
        except Exception:
            return False
    
    def get_average_rating(self, obj):
        try:
            reviews = obj.reviews.all()
            if reviews:
                return sum(r.rating for r in reviews) / len(reviews)
            return None
        except Exception:
            return None
    
    def get_reviews_count(self, obj):
        try:
            return obj.reviews.count()
        except Exception:
            return 0

    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        item = Item.objects.create(**validated_data)
        for image in uploaded_images:
            ItemImage.objects.create(item=item, image=image)
        return item

# New Phase 1 Serializers

class FollowSerializer(serializers.ModelSerializer):
    follower = UserSummarySerializer(read_only=True)
    following = UserSummarySerializer(read_only=True)
    
    class Meta:
        model = Follow
        fields = ['id', 'follower', 'following', 'created_at']
        read_only_fields = ['follower', 'following', 'created_at']


class OrderSerializer(serializers.ModelSerializer):
    buyer = UserSummarySerializer(read_only=True)
    item = ItemSerializer(read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'buyer', 'item', 'status', 'stripe_checkout_session_id',
            'total_amount', 'created_at', 'updated_at'
        ]
        read_only_fields = ['buyer', 'item', 'stripe_checkout_session_id', 'created_at', 'updated_at']


class ReviewSerializer(serializers.ModelSerializer):
    reviewer = UserSummarySerializer(read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'item', 'reviewer', 'rating', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['reviewer', 'created_at', 'updated_at']
    
    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value


class WishlistSerializer(serializers.ModelSerializer):
    item = ItemSerializer(read_only=True)
    
    class Meta:
        model = Wishlist
        fields = ['id', 'item', 'added_at']
        read_only_fields = ['added_at']


class EcoPointsHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EcoPointsHistory
        fields = ['id', 'action', 'points', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']
