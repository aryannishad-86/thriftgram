'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertTriangle, ShoppingBag } from 'lucide-react';
import api from '@/lib/api';
import ItemCard, { Item } from './ItemCard';
import SkeletonCard from './SkeletonCard';
import { EmptyState } from './ui/empty-state';
import { Button } from './ui/button';
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
            } catch (err: unknown) {
                console.error(err);
                // Provide more specific error messages
                if (err && typeof err === 'object' && 'response' in err) {
                    const axiosError = err as { response?: { status?: number } };
                    if (axiosError.response?.status === 500) {
                        setError('Server error. The backend service may be waking up - please wait a moment and try again.');
                    } else if (axiosError.response?.status === 503) {
                        setError('Service unavailable. The server is temporarily unavailable.');
                    } else {
                        setError('Failed to load items. Please try again later.');
                    }
                } else if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'ECONNABORTED') {
                    setError('Request timeout. The server may be starting up - please try again.');
                } else {
                    setError('Failed to load items. Please check your connection.');
                }
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
            <EmptyState
                icon={AlertTriangle}
                title="Something went wrong"
                description={error}
                action={<Button variant="outline" onClick={() => window.location.reload()}>Try refreshing</Button>}
            />
        );
    }

    if (items.length === 0) {
        return (
            <EmptyState
                icon={ShoppingBag}
                title="No items yet"
                description="Be the first to list a unique find and start the collection."
                className="py-32"
            />
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
