import random

class WardrobeService:
    @staticmethod
    def generate_outfit(target_item, user_closet_items):
        """
        Suggests items from the user's closet that match the target item.
        Returns a list of ClosetItem objects.
        """
        # Mock Logic:
        # 1. Filter closet items to exclude the same category as the target item (e.g., don't match a top with a top)
        # 2. Randomly select 1-3 items from the remaining categories.
        
        # In a real app, this would use color theory, style matching, etc.
        
        target_category = getattr(target_item, 'category', None) # Assuming Item might have category later, or we infer it
        
        # Simple category inference for the target item if it doesn't have a category field yet
        # This is a placeholder since our Item model doesn't strictly have 'category' yet in the snippet I saw, 
        # but let's assume we might add it or infer it from description.
        # For now, we'll just return random items from the closet.
        
        if not user_closet_items.exists():
            return []

        # Pick 3 random items
        count = user_closet_items.count()
        num_to_pick = min(3, count)
        
        return random.sample(list(user_closet_items), num_to_pick)
