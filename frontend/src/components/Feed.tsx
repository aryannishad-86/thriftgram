'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import ItemCard, { Item } from './ItemCard';
import SkeletonCard from './SkeletonCard';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

export default function Feed({ filters }: { filters?: Record<string, unknown> }) {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Fetch initial items
    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            setPage(1);
            setHasMore(true);
            try {
                const response = await api.get('/api/items/', {
                    params: { ...filters, page: 1, page_size: 20 }
                });

                // Check if response is paginated
                const data = response.data.results || response.data;
                const hasNext = response.data.next !== null && response.data.next !== undefined;

                setItems(data);
                setHasMore(hasNext);
            } catch (err) {
                console.error(err);
                setError('Failed to load items. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, [filters]);

    // Load more items
    const loadMore = async () => {
        if (loadingMore || !hasMore) return;

        setLoadingMore(true);
        try {
            const nextPage = page + 1;
            const response = await api.get('/api/items/', {
                params: { ...filters, page: nextPage, page_size: 20 }
            });

            const data = response.data.results || response.data;
            const hasNext = response.data.next !== null && response.data.next !== undefined;

            if (data.length === 0) {
                setHasMore(false);
            } else {
                setItems(prev => [...prev, ...data]);
                setPage(nextPage);
                setHasMore(hasNext);
            }
        } catch (err) {
            console.error('Failed to load more items', err);
        } finally {
            setLoadingMore(false);
        }
    };

    const lastItemRef = useInfiniteScroll({
        onLoadMore: loadMore,
        hasMore,
        loading: loadingMore,
    });

    if (loading) {
        return (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {[...Array(10)].map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="p-4 rounded-full bg-red-500/10 mb-4">
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <p className="text-red-400 font-medium">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 text-sm text-white/60 hover:text-white underline underline-offset-4 transition-colors"
                >
                    Try refreshing
                </button>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                    <svg className="w-10 h-10 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold text-base-03 mb-2">No items yet</h3>
                <p className="text-base-02 max-w-sm mx-auto">
                    Be the first to list a unique find and start the collection.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {items.map((item, index) => {
                    // Attach ref to last item
                    const isLastItem = index === items.length - 1;

                    return (
                        <div
                            key={item.id}
                            ref={isLastItem ? lastItemRef : null}
                            className="animate-fade-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <ItemCard item={item} />
                        </div>
                    );
                })}
            </div>

            {/* Loading More Indicator */}
            {loadingMore && (
                <div className="flex justify-center items-center py-8">
                    <Loader2 className="w-8 h-8 text-base-03 animate-spin" />
                    <span className="ml-3 text-base-02">Loading more items...</span>
                </div>
            )}

            {/* End of Results */}
            {!hasMore && items.length > 0 && (
                <div className="text-center py-8">
                    <p className="text-base-02">You've reached the end!</p>
                </div>
            )}
        </>
    );
}
