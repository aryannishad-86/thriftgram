'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import api from '@/lib/api';

interface WishlistButtonProps {
    itemId: number;
    initialIsWishlisted?: boolean;
}

export default function WishlistButton({ itemId, initialIsWishlisted = false }: WishlistButtonProps) {
    const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted);
    const [loading, setLoading] = useState(false);

    const toggleWishlist = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setLoading(true);
        try {
            if (isWishlisted) {
                await api.delete('/api/wishlist/remove/', {
                    data: { item: itemId }
                });
                setIsWishlisted(false);
            } else {
                await api.post('/api/wishlist/', { item: itemId });
                setIsWishlisted(true);
            }
        } catch (error) {
            console.error('Failed to update wishlist', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={toggleWishlist}
            disabled={loading}
            className={`
                p-2 rounded-full transition-all
                ${isWishlisted
                    ? 'bg-error/10 text-error hover:bg-error/20'
                    : 'bg-base-2 text-base-02 hover:bg-error/10 hover:text-error'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
            `}
            title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
            <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
    );
}
