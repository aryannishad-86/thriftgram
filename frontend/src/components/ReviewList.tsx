'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import api from '@/lib/api';
import StarRating from './StarRating';

interface Review {
    id: number;
    reviewer: {
        username: string;
        profile_picture: string | null;
    };
    rating: number;
    comment: string;
    created_at: string;
}

interface ReviewListProps {
    itemId: number;
    refreshTrigger?: number;
}

export default function ReviewList({ itemId, refreshTrigger = 0 }: ReviewListProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [averageRating, setAverageRating] = useState(0);

    useEffect(() => {
        fetchReviews();
    }, [itemId, refreshTrigger]);

    const fetchReviews = async () => {
        try {
            const response = await api.get(`/api/reviews/?item=${itemId}`);
            setReviews(response.data);

            // Calculate average rating
            if (response.data.length > 0) {
                const avg = response.data.reduce((sum: number, r: Review) => sum + r.rating, 0) / response.data.length;
                setAverageRating(avg);
            }
        } catch (err) {
            console.error('Failed to fetch reviews', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="text-base-02">Loading reviews...</div>
            </div>
        );
    }

    return (
        <div>
            {/* Average Rating */}
            {reviews.length > 0 && (
                <div className="mb-6 p-6 bg-card border border-border rounded-2xl">
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-base-03">{averageRating.toFixed(1)}</div>
                            <StarRating rating={Math.round(averageRating)} readonly size="sm" />
                            <div className="text-sm text-base-02 mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</div>
                        </div>
                        <div className="flex-1">
                            {[5, 4, 3, 2, 1].map((star) => {
                                const count = reviews.filter(r => r.rating === star).length;
                                const percentage = (count / reviews.length) * 100;
                                return (
                                    <div key={star} className="flex items-center gap-2 mb-1">
                                        <span className="text-sm text-base-02 w-8">{star}★</span>
                                        <div className="flex-1 h-2 bg-base-2 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-yellow-400"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-base-02 w-8">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
                <div className="text-center py-12 bg-card border border-border rounded-2xl">
                    <MessageSquare className="w-12 h-12 text-base-01 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-base-03 mb-1">No reviews yet</h3>
                    <p className="text-base-02">Be the first to review this item!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review, index) => (
                        <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-card border border-border rounded-2xl p-6"
                        >
                            <div className="flex gap-4">
                                {/* Reviewer Avatar */}
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-base-2 flex-shrink-0">
                                    {review.reviewer.profile_picture ? (
                                        <Image
                                            src={review.reviewer.profile_picture}
                                            alt={review.reviewer.username}
                                            width={48}
                                            height={48}
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-base-01" />
                                        </div>
                                    )}
                                </div>

                                {/* Review Content */}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h4 className="font-semibold text-base-03">@{review.reviewer.username}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <StarRating rating={review.rating} readonly size="sm" />
                                                <span className="text-sm text-base-02">
                                                    {new Date(review.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-base-02">{review.comment}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
