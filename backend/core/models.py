from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

class CustomUser(AbstractUser):
    TIER_CHOICES = [
        ('BRONZE', 'Bronze'),
        ('SILVER', 'Silver'),
        ('GOLD', 'Gold'),
        ('PLATINUM', 'Platinum'),
    ]
    
    bio = models.TextField(blank=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    social_links = models.JSONField(default=dict, blank=True)  # {instagram, twitter, website}
    eco_points = models.IntegerField(default=0)
    eco_tier = models.CharField(max_length=20, choices=TIER_CHOICES, default='BRONZE')
    co2_saved = models.FloatField(default=0.0)  # in kg
    water_saved = models.FloatField(default=0.0)  # in liters
    items_sold_count = models.IntegerField(default=0)
    items_bought_count = models.IntegerField(default=0)

    def update_tier(self):
        """Update user tier based on eco points"""
        if self.eco_points >= 2500:
            self.eco_tier = 'PLATINUM'
        elif self.eco_points >= 1000:
            self.eco_tier = 'GOLD'
        elif self.eco_points >= 500:
            self.eco_tier = 'SILVER'
        else:
            self.eco_tier = 'BRONZE'
        self.save(update_fields=['eco_tier'])

    def __str__(self):
        return self.username


class Item(models.Model):
    CONDITION_CHOICES = [
        ('NEW', 'New with Tags'),
        ('LIKE_NEW', 'Like New'),
        ('GOOD', 'Good'),
        ('FAIR', 'Fair'),
    ]

    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='items')
    title = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    size = models.CharField(max_length=50)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES)
    ai_analysis = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class ItemImage(models.Model):
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='item_images/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.item.title}"

class Like(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='likes')
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'item')

    def __str__(self):
        return f"{self.user.username} likes {self.item.title}"

class ClosetItem(models.Model):
    CATEGORY_CHOICES = [
        ('TOP', 'Top'),
        ('BOTTOM', 'Bottom'),
        ('SHOES', 'Shoes'),
        ('OUTERWEAR', 'Outerwear'),
        ('ACCESSORY', 'Accessory'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='closet_items')
    image = models.ImageField(upload_to='closet_images/')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    color = models.CharField(max_length=50, blank=True)
    is_private = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}'s {self.category}"

class DropEvent(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    items = models.ManyToManyField(Item, related_name='drops')
    image = models.ImageField(upload_to='drop_images/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Follow(models.Model):
    """User follow relationships"""
    follower = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='following')
    following = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='followers')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following')
        indexes = [
            models.Index(fields=['follower', 'created_at']),
            models.Index(fields=['following', 'created_at']),
        ]

    def __str__(self):
        return f"{self.follower.username} follows {self.following.username}"


class Order(models.Model):
    """Order tracking for purchases"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending Payment'),
        ('PAID', 'Paid'),
        ('SHIPPED', 'Shipped'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled'),
    ]

    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='purchases')
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    stripe_payment_intent = models.CharField(max_length=255, blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['buyer', '-created_at']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"Order #{self.id} - {self.item.title}"


class Review(models.Model):
    """Item reviews and ratings"""
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])  # 1-5 stars
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('item', 'reviewer')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['item', '-created_at']),
        ]

    def __str__(self):
        return f"{self.reviewer.username}'s review of {self.item.title}"


class Wishlist(models.Model):
    """User wishlist items"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wishlist')
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='wishlisted_by')
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'item')
        ordering = ['-added_at']
        indexes = [
            models.Index(fields=['user', '-added_at']),
        ]

    def __str__(self):
        return f"{self.user.username}'s wishlist: {self.item.title}"


class EcoPointsHistory(models.Model):
    """Track eco points earning history"""
    ACTION_CHOICES = [
        ('ITEM_LISTED', 'Item Listed'),
        ('ITEM_PURCHASED', 'Item Purchased'),
        ('PROFILE_COMPLETED', 'Profile Completed'),
        ('SUSTAINABLE_BRAND', 'Sustainable Brand Bonus'),
        ('LONGEVITY_BONUS', 'Item Longevity Bonus'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='eco_history')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    points = models.IntegerField()
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.action} (+{self.points})"
