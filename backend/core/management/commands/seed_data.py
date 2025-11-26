from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.models import Item, ItemImage
from django.core.files.base import ContentFile
import requests

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with initial data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding data...')

        # Create Users
        user1, _ = User.objects.get_or_create(username='vintage_queen', email='queen@example.com')
        user1.set_password('password')
        user1.save()

        user2, _ = User.objects.get_or_create(username='thrift_king', email='king@example.com')
        user2.set_password('password')
        user2.save()

        # Create Items
        items_data = [
            {
                'seller': user1,
                'title': 'Vintage Levi 501s',
                'description': 'Classic 90s denim, perfect fade. Size 30.',
                'price': 45.00,
                'size': '30',
                'condition': 'GOOD',
                'image_url': 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?auto=format&fit=crop&w=800&q=80'
            },
            {
                'seller': user2,
                'title': 'Nike Windbreaker',
                'description': 'Retro colorblock windbreaker. Mint condition.',
                'price': 35.00,
                'size': 'L',
                'condition': 'LIKE_NEW',
                'image_url': 'https://images.unsplash.com/photo-1551488852-d81e66344b53?auto=format&fit=crop&w=800&q=80'
            },
            {
                'seller': user1,
                'title': 'Carhartt Jacket',
                'description': 'Distressed workwear jacket. Very trendy.',
                'price': 80.00,
                'size': 'XL',
                'condition': 'FAIR',
                'image_url': 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80'
            }
        ]

        for item_data in items_data:
            image_url = item_data.pop('image_url')
            item, created = Item.objects.get_or_create(
                title=item_data['title'],
                defaults=item_data
            )
            
            if created:
                # Download and save image
                response = requests.get(image_url)
                if response.status_code == 200:
                    item_image = ItemImage(item=item)
                    item_image.image.save(f"{item.title.replace(' ', '_')}.jpg", ContentFile(response.content), save=True)
                    self.stdout.write(f"Created item: {item.title}")

        self.stdout.write(self.style.SUCCESS('Successfully seeded database'))
