'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import api, { unwrap } from '@/lib/api';
import ItemCard from '@/components/ItemCard';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageShell } from '@/components/layout/page-shell';

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
            setWishlist(unwrap<WishlistItem>(response));
        } catch (err) {
            console.error('Failed to fetch wishlist', err);
        } finally {
            setLoading(false);
        }
    };

    const removeFromWishlist = async (itemId: number) => {
        try {
            await api.delete('/api/wishlist/remove/', { data: { item: itemId } });
            setWishlist(wishlist.filter(w => w.item.id !== itemId));
        } catch (err) {
            console.error('Failed to remove from wishlist', err);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background pt-20">
                <div className="text-muted-foreground">Loading wishlist...</div>
            </div>
        );
    }

    return (
        <PageShell>
            <div className="mb-8">
                <h1 className="font-display mb-2 flex items-center gap-3 text-4xl font-semibold text-foreground">
                    <Heart className="h-9 w-9 fill-error text-error" />
                    Wishlist
                </h1>
                <p className="text-muted-foreground">Items you&apos;ve saved for later</p>
            </div>

            {wishlist.length === 0 ? (
                <EmptyState
                    icon={Heart}
                    title="Your wishlist is empty"
                    description="Start adding items you love to your wishlist"
                    action={<Button onClick={() => router.push('/')}>Browse Items</Button>}
                />
            ) : (
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                    <AnimatePresence>
                        {wishlist.map((wishlistItem) => (
                            <motion.div
                                key={wishlistItem.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                            >
                                <ItemCard
                                    item={wishlistItem.item}
                                    onRemove={() => removeFromWishlist(wishlistItem.item.id)}
                                    meta={`by @${wishlistItem.item.seller.username}`}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </PageShell>
    );
}
