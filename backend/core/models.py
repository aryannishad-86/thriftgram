from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

class CustomUser(AbstractUser):
    bio = models.TextField(blank=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    eco_points = models.IntegerField(default=0)
    co2_saved = models.FloatField(default=0.0)  # in kg
    water_saved = models.FloatField(default=0.0)  # in liters

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
