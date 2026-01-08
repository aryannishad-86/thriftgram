'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Share2, ArrowLeft, ShieldCheck, Sparkles, Tag, Layers, Shirt, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
    ai_analysis?: {
        is_verified: boolean;
        detected_brand: string;
        fabric_type: string;
        condition_rating: number;
        detected_defects: string[];
    };
}

export default function ItemDetailPage() {
    const params = useParams();
    const [item, setItem] = useState<Item | null>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [refreshReviews, setRefreshReviews] = useState(0);

    const [matching, setMatching] = useState(false);
    const [matches, setMatches] = useState<any[]>([]);
    const [showMatches, setShowMatches] = useState(false);

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

    if (loading) {
        return (
            <div className="min-h-screen bg-black pt-24 px-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
        );
    }

    if (!item) return null;

    return (
        <main className="min-h-screen bg-black selection:bg-purple-500/30 pt-24 pb-12 px-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black" />

            <div className="container mx-auto max-w-6xl">
                <div className="grid md:grid-cols-2 gap-12">
                    {/* Image Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-white/5 border border-white/10"
                    >
                        <img
                            src={item.images[0]?.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                        />
                        {item.ai_analysis?.is_verified && (
                            <div className="absolute top-4 right-4 bg-green-500/20 backdrop-blur-md border border-green-500/30 text-green-400 px-4 py-2 rounded-full font-bold flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> AI Verified
                            </div>
                        )}
                    </motion.div>

                    {/* Details Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{item.title}</h1>
                            <p className="text-2xl text-purple-400 font-mono">${item.price}</p>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-white/80">
                                Size: <span className="text-white font-bold">{item.size}</span>
                            </div>
                            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-white/80">
                                Condition: <span className="text-white font-bold">{item.condition}</span>
                            </div>
                        </div>

                        <p className="text-lg text-white/60 leading-relaxed">
                            {item.description}
                        </p>

                        {/* AI Analysis Section */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-400" />
                                    AI Quality Verification
                                </h3>
                                <Button
                                    onClick={handleAnalyze}
                                    disabled={analyzing || !!item.ai_analysis}
                                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-full"
                                >
                                    {analyzing ? 'Analyzing...' : item.ai_analysis ? 'Analysis Complete' : 'Run AI Analysis'}
                                </Button>
                            </div>

                            {item.ai_analysis ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-black/20 p-4 rounded-2xl">
                                            <div className="text-xs text-white/40 mb-1">Detected Brand</div>
                                            <div className="text-lg font-bold text-white">{item.ai_analysis.detected_brand}</div>
                                        </div>
                                        <div className="bg-black/20 p-4 rounded-2xl">
                                            <div className="text-xs text-white/40 mb-1">Material</div>
                                            <div className="text-lg font-bold text-white">{item.ai_analysis.fabric_type}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-white/60">Condition Rating</span>
                                            <span className="text-green-400 font-bold">{item.ai_analysis.condition_rating}/10</span>
                                        </div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${item.ai_analysis.condition_rating * 10}%` }}
                                                className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-black/20 p-4 rounded-2xl">
                                        <div className="text-xs text-white/40 mb-2">Defect Analysis</div>
                                        {item.ai_analysis.detected_defects.length > 0 ? (
                                            <ul className="list-disc list-inside text-red-400 text-sm">
                                                {item.ai_analysis.detected_defects.map((defect: string, i: number) => (
                                                    <li key={i}>{defect}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="flex items-center gap-2 text-green-400 text-sm">
                                                <CheckCircle className="w-4 h-4" /> No defects detected
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-white/40 text-sm">
                                    Click "Run AI Analysis" to verify authenticity and condition.
                                </div>
                            )}
                        </div>

                        {/* Wardrobe Matcher Section */}
                        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Shirt className="w-5 h-5 text-blue-400" />
                                    Wardrobe Matcher
                                </h3>
                                <Button
                                    onClick={handleMatchOutfit}
                                    disabled={matching}
                                    variant="outline"
                                    className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 rounded-full"
                                >
                                    {matching ? 'Matching...' : 'Match with My Closet'}
                                </Button>
                            </div>

                            {showMatches && (
                                <div className="mt-6">
                                    <p className="text-white/60 mb-4">This item pairs well with:</p>
                                    {matches.length > 0 ? (
                                        <div className="grid grid-cols-3 gap-4">
                                            {matches.map((match) => (
                                                <div key={match.id} className="aspect-[3/4] rounded-xl overflow-hidden bg-black/40 border border-white/10">
                                                    <img src={match.image} alt={match.category} className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-white/40 text-sm italic">No matches found in your closet yet. Try adding more items!</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4 pt-4">
                            <BuyButton
                                itemId={item.id}
                                price={parseFloat(item.price)}
                                title={item.title}
                                image={item.images[0]?.image}
                                size={item.size}
                            />

                            <Button variant="outline" className="h-14 w-14 rounded-full border-white/20 hover:bg-white/10">
                                <Heart className="w-6 h-6" />
                            </Button>
                            <Button variant="outline" className="h-14 w-14 rounded-full border-white/20 hover:bg-white/10">
                                <Share2 className="w-6 h-6" />
                            </Button>
                        </div>
                    </motion.div>
                </div>

                {/* Reviews Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-16"
                >
                    <h2 className="text-3xl font-bold text-white mb-8">Reviews</h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Review Form */}
                        <div>
                            <ReviewForm
                                itemId={item.id}
                                onReviewSubmitted={() => setRefreshReviews(prev => prev + 1)}
                            />
                        </div>

                        {/* Review List */}
                        <div>
                            <ReviewList itemId={item.id} refreshTrigger={refreshReviews} />
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
