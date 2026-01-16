# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0009_eco_points_system'),
    ]

    operations = [
        migrations.AddField(
            model_name='item',
            name='is_sold',
            field=models.BooleanField(default=False),
        ),
    ]
