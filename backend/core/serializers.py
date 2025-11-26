from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Item, ItemImage, ClosetItem, Like, DropEvent

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'bio', 'profile_picture', 'eco_points', 'co2_saved', 'water_saved']

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'bio', 'profile_picture', 'date_joined', 'eco_points', 'co2_saved', 'water_saved']
        read_only_fields = ['username', 'email', 'date_joined', 'eco_points', 'co2_saved', 'water_saved']

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
    seller = UserSerializer(read_only=True)
    images = ItemImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(max_length=1000000, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False
    )
    likes_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = ['id', 'seller', 'title', 'description', 'price', 'size', 'condition', 'images', 'uploaded_images', 'likes_count', 'is_liked', 'created_at', 'ai_analysis']
        read_only_fields = ['seller', 'created_at', 'ai_analysis']

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        item = Item.objects.create(**validated_data)
        for image in uploaded_images:
            ItemImage.objects.create(item=item, image=image)
        return item

class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ['id', 'user', 'item', 'created_at']
        read_only_fields = ['user']
