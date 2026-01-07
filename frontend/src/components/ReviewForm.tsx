'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import api from '@/lib/api';
import StarRating from './StarRating';

interface ReviewFormProps {
    itemId: number;
    onReviewSubmitted: () => void;
}

export default function ReviewForm({ itemId, onReviewSubmitted }: ReviewFormProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rating === 0) {
            setError('Please select a rating');
            return;
        }

        if (!comment.trim()) {
            setError('Please write a review');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post('/api/reviews/', {
                item: itemId,
                rating,
                comment: comment.trim(),
            });

            // Reset form
            setRating(0);
            setComment('');
            onReviewSubmitted();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="bg-card border border-border rounded-2xl p-6"
        >
            <h3 className="text-xl font-bold text-base-03 mb-4">Write a Review</h3>

            {/* Rating */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-base-03 mb-2">
                    Your Rating
                </label>
                <StarRating rating={rating} onRatingChange={setRating} size="lg" />
            </div>

            {/* Comment */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-base-03 mb-2">
                    Your Review
                </label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base-03 focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                    placeholder="Share your experience with this item..."
                />
            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
                    {error}
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
                <Send className="w-5 h-5" />
                {loading ? 'Submitting...' : 'Submit Review'}
            </button>
        </motion.form>
    );
}
