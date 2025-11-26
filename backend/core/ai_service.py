import random

class AIService:
    @staticmethod
    def analyze_image(image_url):
        """
        Simulates AI analysis of an item image.
        Returns a dictionary with condition, brand, and other details.
        """
        # Mock data - in a real app, this would call Gemini/OpenAI
        conditions = ['New with tags', 'Like New', 'Good', 'Fair', 'Vintage']
        brands = ['Zara', 'H&M', 'Nike', 'Adidas', 'Vintage', 'Uniqlo', 'Levis']
        fabrics = ['Cotton', 'Polyester', 'Denim', 'Silk', 'Wool', 'Leather']
        defects = [[], [], ['Minor stain on sleeve'], ['Small tear near hem'], []]

        # Deterministic mock based on hash of URL to keep it consistent for same image
        seed = hash(image_url)
        random.seed(seed)

        return {
            'condition_rating': random.choice(conditions),
            'detected_brand': random.choice(brands),
            'fabric_type': random.choice(fabrics),
            'detected_defects': random.choice(defects),
            'authenticity_score': random.randint(85, 100) / 100,
            'is_verified': True
        }
