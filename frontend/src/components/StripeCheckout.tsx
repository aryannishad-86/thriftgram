'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import api from '@/lib/api';
import { motion } from 'framer-motion';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripeCheckoutProps {
    itemId: number;
    itemTitle: string;
    price: number;
    isSold?: boolean;
}

export default function StripeCheckout({ itemId, itemTitle, price, isSold = false }: StripeCheckoutProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCheckout = async () => {
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

            // Redirect to Stripe checkout
            const stripe = await stripePromise;

            if (!stripe) {
                throw new Error('Stripe failed to load');
            }

            const { error: stripeError } = await stripe.redirectToCheckout({
                sessionId: data.sessionId
            });

            if (stripeError) {
                setError(stripeError.message || 'Payment failed');
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || 'Failed to initiate checkout';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (isSold) {
        return (
            <button
                disabled
                className="w-full bg-base-02 text-white font-bold py-4 px-6 rounded-xl cursor-not-allowed opacity-50"
            >
                Sold Out
            </button>
        );
    }

    return (
        <div className="w-full">
            <motion.button
                onClick={handleCheckout}
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -2 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="w-full bg-base-03 text-white font-bold py-4 px-6 rounded-xl hover:bg-base-03/90 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Processing...
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Buy Now - ${price.toFixed(2)}
                    </>
                )}
            </motion.button>

            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-600 font-medium"
                >
                    {error}
                </motion.p>
            )}

            <p className="mt-2 text-xs text-base-02 text-center">
                Secure payment powered by Stripe
            </p>
        </div>
    );
}
