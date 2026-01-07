'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
    rating: number;
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export default function StarRating({ rating, onRatingChange, readonly = false, size = 'md' }: StarRatingProps) {
    const [hoverRating, setHoverRating] = useState(0);

    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
    };

    const handleClick = (value: number) => {
        if (!readonly && onRatingChange) {
            onRatingChange(value);
        }
    };

    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => {
                const isFilled = value <= (hoverRating || rating);
                return (
                    <button
                        key={value}
                        type="button"
                        onClick={() => handleClick(value)}
                        onMouseEnter={() => !readonly && setHoverRating(value)}
                        onMouseLeave={() => !readonly && setHoverRating(0)}
                        disabled={readonly}
                        className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
                    >
                        <Star
                            className={`${sizeClasses[size]} ${isFilled ? 'fill-yellow-400 text-yellow-400' : 'text-base-01'
                                }`}
                        />
                    </button>
                );
            })}
        </div>
    );
}
