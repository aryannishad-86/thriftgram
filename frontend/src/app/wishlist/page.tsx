'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, Trash2 } from 'lucide-react';
import api from '@/lib/api';

interface WishlistItem {
    id: number;
    item: {
        id: number;
        title: string;
        price: string;
        images: Array<{ image: string }>;
        seller: {
            username: string;
        };
    };
    added_at: string;
}

export default function WishlistPage() {
    const router = useRouter();
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWishlist();
    }, []);

    const fetchWishlist = async () => {
        try {
            const response = await api.get('/api/wishlist/');
            setWishlist(response.data);
        } catch (err) {
            console.error('Failed to fetch wishlist', err);
        } finally {
            setLoading(false);
        }
    };

    const removeFromWishlist = async (itemId: number) => {
        try {
            await api.delete('/api/wishlist/remove/', {
                data: { item: itemId }
            });
            setWishlist(wishlist.filter(w => w.item.id !== itemId));
        } catch (err) {
            console.error('Failed to remove from wishlist', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center pt-20">
                <div className="text-base-02">Loading wishlist...</div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-background pt-24 pb-12 px-4">
            <div className="container mx-auto max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-base-03 mb-2 flex items-center gap-3">
                        <Heart className="w-10 h-10 text-error fill-error" />
                        Wishlist
                    </h1>
                    <p className="text-base-02">Items you've saved for later</p>
                </div>

                {/* Wishlist Grid */}
                {wishlist.length === 0 ? (
                    <div className="text-center py-16">
                        <Heart className="w-16 h-16 text-base-01 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-base-03 mb-2">
                            Your wishlist is empty
                        </h3>
                        <p className="text-base-02 mb-6">
                            Start adding items you love to your wishlist
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            className="px-6 py-3 rounded-full bg-base-03 text-white font-semibold hover:bg-primary/90 transition-colors"
                        >
                            Browse Items
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {wishlist.map((wishlistItem) => (
                            <motion.div
                                key={wishlistItem.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group relative"
                            >
                                {/* Remove Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFromWishlist(wishlistItem.item.id);
                                    }}
                                    className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm text-error hover:bg-error hover:text-white transition-colors shadow-md"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>

                                {/* Item Image */}
                                <div
                                    onClick={() => router.push(`/items/${wishlistItem.item.id}`)}
                                    className="cursor-pointer"
                                >
                                    <div className="aspect-square bg-base-2 overflow-hidden">
                                        {wishlistItem.item.images && wishlistItem.item.images.length > 0 ? (
                                            <img
                                                src={wishlistItem.item.images[0].image}
                                                alt={wishlistItem.item.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Heart className="w-16 h-16 text-base-01" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Item Details */}
                                    <div className="p-4">
                                        <h3 className="font-semibold text-base-03 mb-1 line-clamp-2">
                                            {wishlistItem.item.title}
                                        </h3>
                                        <p className="text-sm text-base-02 mb-2">
                                            by @{wishlistItem.item.seller.username}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xl font-bold text-base-03">
                                                ${parseFloat(wishlistItem.item.price).toFixed(2)}
                                            </span>
                                            <span className="text-xs text-base-01">
                                                Added {new Date(wishlistItem.added_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
