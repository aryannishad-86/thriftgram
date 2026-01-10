'use client';

import { useState } from 'react';
import { ShoppingBag, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { motion } from 'framer-motion';

interface BuyButtonProps {
    itemId: number;
    price: number;
    title?: string;
    image?: string;
    size?: string;
    isSold?: boolean;
}

export default function BuyButton({ itemId, price, title = 'Item', image = '', size, isSold = false }: BuyButtonProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { addToCart } = useCart();

    const handleBuy = async () => {
        if (isSold) {
            setError('This item has already been sold');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Create checkout session
            const { data } = await api.post('/api/create-checkout-session/', {
                item_id: itemId
            });

            // Redirect to Stripe Checkout URL
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || 'Failed to initiate checkout';
            setError(errorMessage);
            setLoading(false);
        }
    };

    const handleAddToCart = () => {
        if (isSold) {
            return;
        }
        addToCart({
            id: itemId,
            title,
            price,
            image,
            size,
        });
    };

    return (
        <div className="w-full">
            <div className="flex gap-3 w-full">
                <Button
                    onClick={handleAddToCart}
                    disabled={isSold}
                    variant="outline"
                    className="flex-1 border-base-03/50 text-base-03 hover:bg-base-03/10 font-bold py-6 text-lg rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {isSold ? 'Sold' : 'Add to Cart'}
                </Button>

                <motion.div
                    whileHover={{ scale: loading || isSold ? 1 : 1.02 }}
                    whileTap={{ scale: loading || isSold ? 1 : 0.98 }}
                    className="flex-[2]"
                >
                    <Button
                        onClick={handleBuy}
                        disabled={loading || isSold}
                        className="w-full bg-base-03 hover:bg-base-03/90 text-white font-bold py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Processing...
                            </span>
                        ) : isSold ? (
                            <span>Sold Out</span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <ShoppingBag className="h-5 w-5" />
                                Buy Now - ₹{price.toFixed(2)}
                            </span>
                        )}
                    </Button>
                </motion.div>
            </div>

            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-600 font-medium"
                >
                    {error}
                </motion.p>
            )}

            {!isSold && (
                <p className="mt-2 text-xs text-base-02 text-center">
                    Secure payment powered by Stripe
                </p>
            )}
        </div>
    );
}
