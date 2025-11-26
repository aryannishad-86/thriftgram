import { Heart } from 'lucide-react';

export default function SkeletonCard() {
    return (
        <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            {/* Image Container Skeleton */}
            <div className="aspect-[4/5] relative overflow-hidden bg-white/5 animate-pulse">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent animate-shimmer" />

                {/* Heart Button Skeleton */}
                <div className="absolute right-3 top-3 rounded-full bg-white/10 p-2.5 h-9 w-9" />

                {/* Overlay Content Skeleton */}
                <div className="absolute bottom-0 left-0 w-full p-4">
                    <div className="flex justify-between items-end mb-1">
                        <div className="flex-1 mr-2 space-y-2">
                            {/* Price Skeleton */}
                            <div className="h-6 w-16 bg-white/10 rounded" />
                            {/* Title Skeleton */}
                            <div className="h-4 w-32 bg-white/10 rounded" />
                        </div>
                        {/* Likes Skeleton */}
                        <div className="h-5 w-12 bg-white/10 rounded-full" />
                    </div>
                    {/* Metadata Skeleton */}
                    <div className="mt-2 flex items-center gap-2">
                        <div className="h-4 w-8 bg-white/10 rounded" />
                        <div className="h-4 w-20 bg-white/10 rounded" />
                    </div>
                </div>
            </div>
        </div>
    );
}
