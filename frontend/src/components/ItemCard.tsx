import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';

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

export default function ItemCard({ item: initialItem }: { item: Item }) {
    const [item, setItem] = useState(initialItem);
    const [isLiking, setIsLiking] = useState(false);
    const mainImage = item.images.length > 0 ? item.images[0].image : '/placeholder.jpg';

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isLiking) return;

        setIsLiking(true);
        // Optimistic update
        const previousState = { ...item };
        setItem(prev => ({
            ...prev,
            is_liked: !prev.is_liked,
            likes_count: prev.is_liked ? prev.likes_count - 1 : prev.likes_count + 1
        }));

        try {
            if (previousState.is_liked) {
                await api.post(`/api/items/${item.id}/unlike/`);
            } else {
                await api.post(`/api/items/${item.id}/like/`);
            }
        } catch (error) {
            // Revert on failure
            console.error('Failed to toggle like:', error);
            setItem(previousState);
        } finally {
            setIsLiking(false);
        }
    };

    return (
        <motion.div
            whileHover={{ y: -8 }}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-500 hover:border-primary/80 hover:shadow-[0_0_40px_-5px_rgba(109,40,217,0.6)]"
        >
            {/* Image Container */}
            <div className="aspect-[4/5] relative overflow-hidden bg-secondary/50">
                <Image
                    src={mainImage}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80" />

                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleLike}
                    className="absolute right-3 top-3 rounded-full bg-black/40 p-2.5 text-white backdrop-blur-md border border-white/10 transition-all hover:bg-white hover:text-red-500 z-10 hover:border-transparent"
                >
                    <Heart className={`h-4 w-4 ${item.is_liked ? 'fill-red-500 text-red-500' : ''} ${isLiking ? 'animate-pulse' : ''}`} />
                </motion.button>

                {/* Overlay Content */}
                <div className="absolute bottom-0 left-0 w-full p-4 translate-y-2 opacity-90 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <div className="flex justify-between items-end mb-1">
                        <div className="flex-1 min-w-0 mr-2">
                            <p className="font-bold text-white text-xl tracking-tight">${item.price}</p>
                            <h3 className="font-medium text-white/90 line-clamp-1 text-sm truncate">{item.title}</h3>
                        </div>
                        <div className="text-xs text-white/70 flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm border border-white/5">
                            <Heart className="h-3 w-3 fill-white/70" /> {item.likes_count}
                        </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-white/60 font-medium">
                        <span className="bg-white/10 px-2 py-0.5 rounded text-white/80">{item.size}</span>
                        <span>•</span>
                        <span className="uppercase tracking-wider">{item.condition.replace('_', ' ')}</span>
                    </div>
                </div>
            </div>

            <Link href={`/items/${item.id}`} className="absolute inset-0">
                <span className="sr-only">View Item</span>
            </Link>
        </motion.div>
    );
}
