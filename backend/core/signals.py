from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Item, Order, EcoPointsHistory, CustomUser


@receiver(post_save, sender=Item)
def award_points_for_listing(sender, instance, created, **kwargs):
    """Award eco points when a user lists an item"""
    if created:
        user = instance.seller
        points = 50
        
        # Update user stats
        user.eco_points += points
        user.items_sold_count += 1
        user.co2_saved += 5.5  # Average CO2 saved per garment
        user.water_saved += 2700  # Average water saved per garment
        user.save()
        
        # Create history record
        EcoPointsHistory.objects.create(
            user=user,
            action='ITEM_LISTED',
            points=points,
            description=f'Listed "{instance.title}"'
        )
        
        # Update tier
        user.update_tier()


@receiver(post_save, sender=Order)
def award_points_for_purchase(sender, instance, created, **kwargs):
    """Award eco points when a user purchases an item"""
    if created and instance.status == 'PAID':
        user = instance.buyer
        points = 20
        
        # Update user stats
        user.eco_points += points
        user.items_bought_count += 1
        user.save()
        
        # Create history record
        EcoPointsHistory.objects.create(
            user=user,
            action='ITEM_PURCHASED',
            points=points,
            description=f'Purchased "{instance.item.title}"'
        )
        
        # Update tier
        user.update_tier()


@receiver(post_save, sender=CustomUser)
def award_profile_completion_bonus(sender, instance, created, **kwargs):
    """Award one-time bonus for completing profile"""
    if not created and instance.bio and instance.profile_picture:
        # Check if bonus was already awarded
        already_awarded = EcoPointsHistory.objects.filter(
            user=instance,
            action='PROFILE_COMPLETED'
        ).exists()
        
        if not already_awarded:
            points = 100
            instance.eco_points += points
            instance.save(update_fields=['eco_points'])
            
            EcoPointsHistory.objects.create(
                user=instance,
                action='PROFILE_COMPLETED',
                points=points,
                description='Completed profile with bio and picture'
            )
            
            instance.update_tier()
