'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { ShoppingBag, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useCart } from '@/context/CartContext';

// Placeholder key - in production this should be an env var
const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

interface BuyButtonProps {
    itemId: number;
    price: number;
    title?: string; // Added title for cart
    image?: string; // Added image for cart
    size?: string;  // Added size for cart
}

export default function BuyButton({ itemId, price, title = 'Item', image = '', size }: BuyButtonProps) {
    const [loading, setLoading] = useState(false);
    const { addToCart } = useCart();

    const handleBuy = async () => {
        setLoading(true);
        try {
            const response = await api.post(`/api/items/${itemId}/create_checkout_session/`);
            const { url } = response.data;
            if (url) {
                window.location.href = url;
            }
        } catch (error) {
            console.error('Error creating checkout session:', error);
            alert('Failed to start checkout process. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = () => {
        addToCart({
            id: itemId,
            title,
            price,
            image,
            size,
        });
    };

    return (
        <div className="flex gap-3 w-full">
            <Button
                onClick={handleAddToCart}
                variant="outline"
                className="flex-1 border-primary/50 text-base-03 hover:bg-primary/10 font-bold py-6 text-lg rounded-xl transition-all duration-300"
            >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
            </Button>
            <Button
                onClick={handleBuy}
                disabled={loading}
                className="flex-[2] bg-base-03 hover:bg-base-03/90 text-white font-bold py-6 text-lg rounded-xl shadow-[0_0_20px_-5px_rgba(124,58,237,0.5)] hover:shadow-[0_0_30px_-5px_rgba(124,58,237,0.7)] transition-all duration-300"
            >
                {loading ? (
                    <span className="flex items-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Processing...
                    </span>
                ) : (
                    <span className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5" />
                        Buy Now - ${price}
                    </span>
                )}
            </Button>
        </div>
    );
}

