from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    CustomUser, Item, ItemImage, Like, Order, Review, Wishlist,
    Follow, ClosetItem, DropEvent, EcoPointsHistory,
)

class ItemImageInline(admin.TabularInline):
    model = ItemImage
    extra = 1

class ItemAdmin(admin.ModelAdmin):
    inlines = [ItemImageInline]
    list_display = ('title', 'seller', 'price', 'condition', 'is_sold', 'created_at')
    search_fields = ('title', 'description')
    list_filter = ('condition', 'is_sold', 'created_at')

class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'buyer', 'item', 'status', 'total_amount', 'created_at')
    list_filter = ('status', 'created_at')

admin.site.register(CustomUser, UserAdmin)
admin.site.register(Item, ItemAdmin)
admin.site.register(Order, OrderAdmin)
admin.site.register(Like)
admin.site.register(Review)
admin.site.register(Wishlist)
admin.site.register(Follow)
admin.site.register(ClosetItem)
admin.site.register(DropEvent)
admin.site.register(EcoPointsHistory)
