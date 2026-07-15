from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Item, Order, EcoPointsHistory, CustomUser


@receiver(post_save, sender=Item)
def award_points_for_listing(sender, instance, created, **kwargs):
    """Award eco points for listing an item. Environmental impact and the
    sold-count are NOT credited here — an item that's merely listed hasn't been
    reused yet. Those land on the sale (award_points_for_purchase)."""
    if created:
        user = instance.seller
        points = 50

        user.eco_points += points
        user.save()

        EcoPointsHistory.objects.create(
            user=user,
            action='ITEM_LISTED',
            points=points,
            description=f'Listed "{instance.title}"'
        )

        user.update_tier()


@receiver(pre_save, sender=Order)
def capture_old_order_status(sender, instance, **kwargs):
    """Capture the previous status before saving so post_save can detect transitions"""
    if instance.pk:
        try:
            instance._old_status = Order.objects.get(pk=instance.pk).status
        except Order.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None


@receiver(post_save, sender=Order)
def award_points_for_purchase(sender, instance, created, **kwargs):
    """Award eco points when an order transitions to PAID status"""
    old_status = getattr(instance, '_old_status', None)
    transitioned_to_paid = instance.status == 'PAID' and old_status != 'PAID'
    
    if not transitioned_to_paid:
        return

    # Buyer: purchase points + bought count
    buyer = instance.buyer
    points = 20
    buyer.eco_points += points
    buyer.items_bought_count += 1
    buyer.save()

    EcoPointsHistory.objects.create(
        user=buyer,
        action='ITEM_PURCHASED',
        points=points,
        description=f'Purchased "{instance.item.title}"'
    )
    buyer.update_tier()

    # Seller: the sale is the real reuse event — credit sold count + impact now
    seller = instance.item.seller
    seller.items_sold_count += 1
    seller.co2_saved += 5.5   # avg CO2 saved by reusing one garment (kg)
    seller.water_saved += 2700  # avg water saved by reusing one garment (L)
    seller.save()
    seller.update_tier()



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
