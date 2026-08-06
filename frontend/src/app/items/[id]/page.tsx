'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, Share2, Sparkles, Shirt, CheckCircle, MessageCircle, PackageSearch } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageShell } from '@/components/layout/page-shell';
import BuyButton from '@/components/BuyButton';
import ReviewForm from '@/components/ReviewForm';
import ReviewList from '@/components/ReviewList';


interface Item {
    id: number;
    title: string;
    price: string;
    size: string;
    condition: string;
    description: string;
    images: { image: string }[];
    seller: {
        id: number;
        username: string;
        profile_picture?: string | null;
    };
    ai_analysis?: {
        is_verified: boolean;
        detected_brand: string;
        fabric_type: string;
        condition_rating: number;
        detected_defects: string[];
        mock?: boolean;
    };
}

export default function ItemDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [item, setItem] = useState<Item | null>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [refreshReviews, setRefreshReviews] = useState(0);

    const [matching, setMatching] = useState(false);
    const [matches, setMatches] = useState<any[]>([]);
    const [showMatches, setShowMatches] = useState(false);
    const [messagingLoading, setMessagingLoading] = useState(false);
    const [currentUsername, setCurrentUsername] = useState<string | null>(null);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [shared, setShared] = useState(false);

    useEffect(() => {
        setCurrentUsername(localStorage.getItem('username'));
    }, []);

    const isOwner = !!item && item.seller?.username === currentUsername;

    useEffect(() => {
        const fetchItem = async () => {
            try {
                const res = await api.get(`/api/items/${params.id}/`);
                setItem(res.data);
            } catch (error) {
                console.error('Failed to fetch item', error);
            } finally {
                setLoading(false);
            }
        };
        fetchItem();
    }, [params.id]);

    const handleAnalyze = async () => {
        if (!item) return;
        setAnalyzing(true);
        try {
            const res = await api.post(`/api/items/${item.id}/analyze/`);
            setItem(prev => prev ? { ...prev, ai_analysis: res.data } : null);
        } catch (error) {
            console.error('Failed to analyze item', error);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleMatchOutfit = async () => {
        if (!item) return;
        setMatching(true);
        try {
            const res = await api.get(`/api/items/${item.id}/match_outfit/`);
            setMatches(res.data);
            setShowMatches(true);
        } catch (error) {
            console.error('Failed to match outfit', error);
        } finally {
            setMatching(false);
        }
    };

    const handleMessageSeller = async () => {
        if (!item) return;
        setMessagingLoading(true);
        try {
            const res = await api.post('/api/conversations/', {
                other_user: item.seller.id,
                item: item.id
            });
            router.push(`/messages?conversation=${res.data.id}`);
        } catch (error) {
            console.error('Failed to start conversation', error);
        } finally {
            setMessagingLoading(false);
        }
    };

    const handleToggleWishlist = async () => {
        if (!item) return;
        if (!localStorage.getItem('access_token')) {
            router.push('/login');
            return;
        }
        setWishlistLoading(true);
        try {
            if (isWishlisted) {
                await api.delete('/api/wishlist/remove/', { data: { item: item.id } });
                setIsWishlisted(false);
            } else {
                await api.post('/api/wishlist/', { item: item.id });
                setIsWishlisted(true);
            }
        } catch (err) {
            const status = (err as { response?: { status?: number } }).response?.status;
            if (!isWishlisted && status === 400) setIsWishlisted(true);
            else console.error('Failed to update wishlist', err);
        } finally {
            setWishlistLoading(false);
        }
    };

    const handleShare = async () => {
        const url = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({ title: item?.title, url });
            } else {
                await navigator.clipboard.writeText(url);
                setShared(true);
                setTimeout(() => setShared(false), 2000);
            }
        } catch {
            // user cancelled the share sheet
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background px-4 pt-24">
                <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-primary" />
            </div>
        );
    }

    if (!item) {
        return (
            <PageShell maxWidth="2xl">
                <EmptyState
                    icon={PackageSearch}
                    title="Item not found"
                    description="This listing may have been removed or sold."
                    action={<Button onClick={() => router.push('/')}>Browse items</Button>}
                />
            </PageShell>
        );
    }

    return (
        <PageShell>
            <div className="grid gap-12 md:grid-cols-2">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative aspect-[3/4] overflow-hidden rounded-3xl border border-border bg-card shadow-lg"
                >
                    <Image
                        src={item.images[0]?.image || '/placeholder.jpg'}
                        alt={item.title}
                        fill
                        className="object-cover"
                        priority
                    />
                    {item.ai_analysis?.is_verified && (
                        <div className="glass-light absolute right-4 top-4 flex items-center gap-2 rounded-full px-4 py-2 font-bold text-success">
                            <Sparkles className="h-4 w-4" /> AI Verified
                        </div>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-8"
                >
                    <div>
                        <h1 className="font-display mb-2 text-4xl font-semibold text-foreground md:text-5xl">{item.title}</h1>
                        <p className="font-mono text-2xl text-foreground">₹{item.price}</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="rounded-xl border border-border bg-card px-4 py-2 text-muted">
                            Size: <span className="font-bold text-foreground">{item.size}</span>
                        </div>
                        <div className="rounded-xl border border-border bg-card px-4 py-2 text-muted">
                            Condition: <span className="font-bold text-foreground">{item.condition}</span>
                        </div>
                    </div>

                    <p className="text-lg leading-relaxed text-muted-foreground">
                        {item.description}
                    </p>

                    <Card padding="lg">
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="flex items-center gap-2 text-xl font-bold text-foreground">
                                <Sparkles className="h-5 w-5" />
                                AI Quality Verification
                            </h3>
                            {isOwner && (
                                <Button
                                    onClick={handleAnalyze}
                                    disabled={analyzing || !!item.ai_analysis}
                                    size="sm"
                                >
                                    {analyzing ? 'Analyzing...' : item.ai_analysis ? 'Analysis Complete' : 'Run AI Analysis'}
                                </Button>
                            )}
                        </div>

                        {item.ai_analysis ? (
                            <div className="space-y-4">
                                {item.ai_analysis.mock && (
                                    <div className="rounded-xl border border-warning/20 bg-warning/5 px-3 py-2 text-xs text-warning">
                                        Sample analysis — AI is currently unavailable, so these values are illustrative only.
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-2xl border border-border bg-base-2 p-4">
                                        <div className="mb-1 text-xs text-muted">Detected Brand</div>
                                        <div className="text-lg font-bold text-foreground">{item.ai_analysis.detected_brand}</div>
                                    </div>
                                    <div className="rounded-2xl border border-border bg-base-2 p-4">
                                        <div className="mb-1 text-xs text-muted">Material</div>
                                        <div className="text-lg font-bold text-foreground">{item.ai_analysis.fabric_type}</div>
                                    </div>
                                </div>

                                <div>
                                    <div className="mb-2 flex justify-between text-sm">
                                        <span className="text-muted-foreground">Condition Rating</span>
                                        <span className="font-bold text-success">{item.ai_analysis.condition_rating}/10</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-base-2">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.ai_analysis.condition_rating * 10}%` }}
                                            className="h-full bg-success"
                                        />
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-border bg-base-2 p-4">
                                    <div className="mb-2 text-xs text-muted">Defect Analysis</div>
                                    {item.ai_analysis.detected_defects.length > 0 ? (
                                        <ul className="list-inside list-disc text-sm text-error">
                                            {item.ai_analysis.detected_defects.map((defect: string, i: number) => (
                                                <li key={i}>{defect}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm text-success">
                                            <CheckCircle className="h-4 w-4" /> No defects detected
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-center text-sm text-muted">
                                {isOwner
                                    ? 'Click "Run AI Analysis" to verify authenticity and condition.'
                                    : 'No AI analysis available for this item yet.'}
                            </div>
                        )}
                    </Card>

                    <Card padding="lg">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="flex items-center gap-2 text-xl font-bold text-foreground">
                                <Shirt className="h-5 w-5" />
                                Wardrobe Matcher
                            </h3>
                            <Button
                                onClick={handleMatchOutfit}
                                disabled={matching}
                                variant="outline"
                                size="sm"
                            >
                                {matching ? 'Matching...' : 'Match with My Closet'}
                            </Button>
                        </div>

                        {showMatches && (
                            <div className="mt-6">
                                <p className="mb-4 text-muted-foreground">This item pairs well with:</p>
                                {matches.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-4">
                                        {matches.map((match) => (
                                            <div key={match.id} className="aspect-[3/4] overflow-hidden rounded-xl border border-border bg-base-2">
                                                <img src={match.image} alt={match.category} className="h-full w-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm italic text-muted">No matches found in your closet yet. Try adding more items!</p>
                                )}
                            </div>
                        )}
                    </Card>

                    <div className="flex flex-col gap-4 pt-4">
                        <BuyButton
                            itemId={item.id}
                            price={parseFloat(item.price)}
                            title={item.title}
                            image={item.images[0]?.image}
                            size={item.size}
                        />

                        <Button
                            onClick={handleMessageSeller}
                            disabled={messagingLoading}
                            variant="outline"
                            size="lg"
                            loading={messagingLoading}
                        >
                            <MessageCircle className="h-5 w-5" />
                            {messagingLoading ? 'Starting chat...' : 'Message Seller'}
                        </Button>

                        <div className="flex gap-4">
                            <Button
                                onClick={handleToggleWishlist}
                                disabled={wishlistLoading}
                                variant="outline"
                                size="lg"
                                className="flex-1"
                            >
                                <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current text-error' : ''}`} />
                                {isWishlisted ? 'Saved' : 'Save'}
                            </Button>
                            <Button
                                onClick={handleShare}
                                variant="outline"
                                size="lg"
                                className="flex-1"
                            >
                                <Share2 className="h-5 w-5" />
                                {shared ? 'Copied!' : 'Share'}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-16"
            >
                <h2 className="font-display mb-8 text-3xl font-semibold text-foreground">Reviews</h2>

                <div className="grid gap-8 md:grid-cols-2">
                    <div>
                        <ReviewForm
                            itemId={item.id}
                            onReviewSubmitted={() => setRefreshReviews(prev => prev + 1)}
                        />
                    </div>
                    <div>
                        <ReviewList itemId={item.id} refreshTrigger={refreshReviews} />
                    </div>
                </div>
            </motion.div>
        </PageShell>
    );
}
