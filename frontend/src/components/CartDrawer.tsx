'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import api from '@/lib/api';

export default function CartDrawer() {
    const { items, isCartOpen, closeCart, removeFromCart, cartTotal } = useCart();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCheckout = async () => {
        if (!localStorage.getItem('access_token')) {
            window.location.href = '/login';
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.post('/api/create-checkout-session/', {
                item_ids: items.map((i) => i.id),
            });
            if (data.url) {
                // Cart is cleared on the /orders success return, not here — a
                // cancelled payment must leave the cart intact.
                window.location.href = data.url;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (err) {
            const e = err as { response?: { data?: { error?: string } }; message?: string };
            setError(e.response?.data?.error || e.message || 'Checkout failed');
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isCartOpen && (
                <>
                    {/* Backdrop scrim — a genuine modal-dimming layer, one of the
                        permitted glass surfaces. */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeCart}
                        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
                    />

                    {/* The drawer itself is a flat solid surface, not glass — a
                        utilitarian form/list overlay has no photography behind it
                        to blur, and it needs to stay legible over every page in
                        the app (including plain, content-light ones), not just
                        image-heavy ones. */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 z-[101] flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-2xl"
                    >
                        <div className="flex items-center justify-between border-b border-border p-6">
                            <div className="flex items-center gap-3">
                                <ShoppingBag className="h-5 w-5 text-foreground" />
                                <h2 className="text-xl font-bold text-foreground">Your Cart ({items.length})</h2>
                            </div>
                            <button
                                onClick={closeCart}
                                className="rounded-full p-2 text-foreground transition-colors hover:bg-base-2"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 space-y-6 overflow-y-auto p-6">
                            {items.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center space-y-4 text-center text-muted-foreground">
                                    <ShoppingBag className="h-16 w-16 opacity-20" />
                                    <p className="text-lg">Your cart is empty</p>
                                    <Button variant="outline" onClick={closeCart}>
                                        Continue Shopping
                                    </Button>
                                </div>
                            ) : (
                                items.map((item, index) => (
                                    <motion.div
                                        key={`${item.id}-${index}`}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="flex gap-4 rounded-xl border border-border bg-base-2 p-4"
                                    >
                                        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-base-1">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={item.image}
                                                alt={item.title}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="flex flex-1 flex-col justify-between">
                                            <div>
                                                <h3 className="line-clamp-1 font-medium text-foreground">{item.title}</h3>
                                                <p className="text-sm text-muted-foreground">Size: {item.size || 'N/A'}</p>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between">
                                                <span className="font-bold text-foreground">₹{item.price}</span>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="text-muted-foreground transition-colors hover:text-error"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {items.length > 0 && (
                            <div className="border-t border-border bg-card p-6">
                                <div className="mb-4 flex items-center justify-between text-lg font-bold text-foreground">
                                    <span>Subtotal</span>
                                    <span>₹{cartTotal.toFixed(2)}</span>
                                </div>
                                <p className="mb-2 text-center text-xs text-muted-foreground">
                                    Shipping and taxes calculated at checkout.
                                </p>
                                {error && <Alert variant="error" className="mb-4">{error}</Alert>}
                                <Button onClick={handleCheckout} disabled={loading} loading={loading} size="lg" className="w-full">
                                    {loading ? 'Processing...' : <>Checkout <ArrowRight className="ml-2 h-5 w-5" /></>}
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
