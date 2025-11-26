from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Item, ItemImage, Like

class ItemImageInline(admin.TabularInline):
    model = ItemImage
    extra = 1

class ItemAdmin(admin.ModelAdmin):
    inlines = [ItemImageInline]
    list_display = ('title', 'seller', 'price', 'condition', 'created_at')
    search_fields = ('title', 'description')
    list_filter = ('condition', 'created_at')

admin.site.register(CustomUser, UserAdmin)
admin.site.register(Item, ItemAdmin)
admin.site.register(Like)
