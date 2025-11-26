class EcoService:
    @staticmethod
    def calculate_impact(item_category='clothing'):
        """
        Calculates the environmental impact saved by buying used.
        Returns dictionary with co2_saved (kg) and water_saved (liters).
        """
        # Estimates based on industry averages for a generic clothing item
        # In a real app, this would be more granular based on category/material
        impact = {
            'clothing': {'co2': 10.0, 'water': 700.0}, # T-shirt/Jeans average
            'shoes': {'co2': 14.0, 'water': 2000.0},
            'accessories': {'co2': 2.0, 'water': 50.0}
        }
        
        data = impact.get(item_category, impact['clothing'])
        return {
            'co2_saved': data['co2'],
            'water_saved': data['water'],
            'points': int(data['co2'] * 10) # 10 points per kg of CO2
        }

    @staticmethod
    def award_points(user, action_type='buy'):
        """
        Awards points to a user for an action.
        """
        impact = EcoService.calculate_impact()
        
        user.eco_points += impact['points']
        user.co2_saved += impact['co2_saved']
        user.water_saved += impact['water_saved']
        user.save()
        
        return impact
