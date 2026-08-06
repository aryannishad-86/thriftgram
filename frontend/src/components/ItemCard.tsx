'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

export interface Item {
    id: number;
    title: string;
    price: string;
    size: string;
    condition: string;
    images: { id: number; image: string }[];
    seller: { username: string; profile_picture: string | null };
    likes_count: number;
    is_liked: boolean;
    ai_analysis?: {
        condition_rating: string;
        detected_brand: string;
        is_verified: boolean;
    };
}

export interface ItemCardData {
    id: number;
    title: string;
    price: string;
    size?: string;
    condition?: string;
    images: { id: number; image: string }[];
    likes_count?: number;
    is_liked?: boolean;
}

export interface ItemCardProps {
    item: ItemCardData;
    href?: string;
    /** Wishlist "remove" action — when given, replaces the like button with
     * a remove button (a card only ever gets one corner action). */
    onRemove?: () => void;
    /** Extra line under the price — e.g. "by @seller" or "Added Jan 3". */
    meta?: React.ReactNode;
    className?: string;
}

/**
 * The one marketplace item card — replaces 3 previous independent
 * implementations (feed 4:5 dark-glass, wishlist 1:1 light, closet 3:4
 * light) with a single component at one canonical aspect ratio.
 *
 * This is the reference implementation of the surgical-glass rule: the
 * bottom price/title scrim is a plain gradient (real photography behind
 * it, no blur needed), and the corner action button is the one genuine
 * "glass over photo" surface — `.glass-dark` from globals.css.
 */
export default function ItemCard({ item: initialItem, href, onRemove, meta, className }: ItemCardProps) {
    const [item, setItem] = useState(initialItem);
    const [isLiking, setIsLiking] = useState(false);
    const mainImage = item.images.length > 0 ? item.images[0].image : '/placeholder.jpg';
    const canLike = !onRemove && item.is_liked !== undefined && item.likes_count !== undefined;

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isLiking) return;

        setIsLiking(true);
        const previousState = { ...item };
        setItem(prev => ({
            ...prev,
            is_liked: !prev.is_liked,
            likes_count: (prev.likes_count ?? 0) + (prev.is_liked ? -1 : 1),
        }));

        try {
            if (previousState.is_liked) {
                await api.post(`/api/items/${item.id}/unlike/`);
            } else {
                await api.post(`/api/items/${item.id}/like/`);
            }
        } catch (error) {
            console.error('Failed to toggle like:', error);
            setItem(previousState);
        } finally {
            setIsLiking(false);
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onRemove?.();
    };

    return (
        <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className={cn(
                "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow duration-300 hover:shadow-lg",
                className
            )}
        >
            <div className="relative aspect-[4/5] overflow-hidden bg-base-2">
                <Image
                    src={mainImage}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Bottom scrim + info — always visible, not hover-gated (hiding
                    price behind hover doesn't work on touch devices). Plain
                    gradient, not glass — there's real photography behind it,
                    no translucent surface needed. */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="text-lg font-semibold tracking-tight text-white">₹{item.price}</p>
                    <h3 className="truncate text-sm text-white/85">{item.title}</h3>
                    {meta && <p className="mt-0.5 truncate text-xs text-white/60">{meta}</p>}
                    {(item.size || item.condition) && (
                        <div className="mt-2 flex items-center gap-2 text-xs font-medium text-white/60">
                            {item.size && <span className="rounded bg-white/10 px-2 py-0.5 text-white/80">{item.size}</span>}
                            {item.condition && <span className="uppercase tracking-wider">{item.condition.replace('_', ' ')}</span>}
                        </div>
                    )}
                </div>

                {/* The one genuine glass-over-photo surface on this card. */}
                {canLike && (
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleLike}
                        aria-label={item.is_liked ? 'Unlike' : 'Like'}
                        className="glass-dark absolute right-3 top-3 z-10 rounded-full p-2.5 text-white transition-colors hover:bg-error hover:border-error"
                    >
                        <Heart className={cn('h-4 w-4', item.is_liked && 'fill-current', isLiking && 'animate-pulse')} />
                    </motion.button>
                )}
                {onRemove && (
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleRemove}
                        aria-label="Remove"
                        className="glass-dark absolute right-3 top-3 z-10 rounded-full p-2.5 text-white transition-colors hover:bg-error hover:border-error"
                    >
                        <Trash2 className="h-4 w-4" />
                    </motion.button>
                )}
            </div>

            <Link href={href ?? `/items/${item.id}`} className="absolute inset-0">
                <span className="sr-only">View {item.title}</span>
            </Link>
        </motion.div>
    );
}
