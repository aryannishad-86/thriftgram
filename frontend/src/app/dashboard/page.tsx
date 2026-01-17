'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, DollarSign, Eye, Star, Plus, Edit, Trash2, Leaf, Droplets, Heart } from 'lucide-react';
import api from '@/lib/api';
import StatsCard from '@/components/StatsCard';
import ListingsTable from '@/components/ListingsTable';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

interface DashboardStats {
    total_listings: number;
    total_likes: number;
    total_sales: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Check auth
                const token = localStorage.getItem('access_token');
                if (!token) {
                    router.push('/login');
                    return;
                }

                // Fetch user info to get username
                // Ideally we should store user info in context/storage, but fetching for now
                // We need the username to filter items. 
                // Let's assume we can get it from a profile endpoint or decode token.
                // Fetch User Info
                const userRes = await api.get('/api/users/me/');
                setUser(userRes.data);

                // Fetch Stats
                const statsRes = await api.get('/api/users/dashboard_stats/');
                setStats(statsRes.data);

                // Fetch Items using the username from stats (or userRes)
                if (statsRes.data.username) {
                    const itemsRes = await api.get('/api/items/', {
                        params: { seller_username: statsRes.data.username }
                    });
                    // Handle paginated response - extract results array
                    const itemsData = itemsRes.data.results ?? itemsRes.data;
                    setItems(Array.isArray(itemsData) ? itemsData : []);
                }

            } catch (error) {
                console.error('Failed to load dashboard data', error);
                // router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    // Separate effect for fetching items once we have the username (after backend update)
    // For now, let's implement the structure.

    return (
        <main className="min-h-screen bg-background selection:bg-primary/20 relative overflow-hidden pt-24 pb-12 px-4">
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 -z-30 bg-base-3" />
            <div className="absolute inset-0 -z-20 bg-[url('/grid.svg')] bg-center opacity-[0.03]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="container mx-auto max-w-6xl space-y-8 relative z-10"
            >
                {/* Header */}
                <div>
                    <h1 className="text-4xl font-bold text-base-03 tracking-tight">Seller Dashboard</h1>
                    <p className="text-base-02 mt-2 text-lg">Overview of your store performance</p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {loading ? (
                        <>
                            <Skeleton className="h-32 rounded-2xl bg-base-2" />
                            <Skeleton className="h-32 rounded-2xl bg-base-2" />
                            <Skeleton className="h-32 rounded-2xl bg-base-2" />
                            <Skeleton className="h-32 rounded-2xl bg-base-2" />
                        </>
                    ) : (
                        <>
                            <StatsCard
                                title="Total Listings"
                                value={stats?.total_listings || 0}
                                icon={<Package className="w-6 h-6" />}
                                description="Active items in your store"
                            />
                            <StatsCard
                                title="Total Likes"
                                value={stats?.total_likes || 0}
                                icon={<Heart className="w-6 h-6" />}
                                description="Across all your items"
                            />
                            <StatsCard
                                title="Total Sales"
                                value={`₹${stats?.total_sales || 0}`}
                                icon={<DollarSign className="w-6 h-6" />}
                                description="Lifetime earnings"
                            />
                            <StatsCard
                                title="Eco Points"
                                value={user?.eco_points || 0}
                                icon={<Leaf className="w-6 h-6" />}
                                description="Environmental impact score"
                                trend="+120 this month"
                            />
                            <StatsCard
                                title="CO₂ Saved"
                                value={`${user?.co2_saved || 0}kg`}
                                icon={<Droplets className="w-6 h-6" />}
                                description="Carbon footprint reduced"
                            />
                        </>
                    )}
                </div>

                {/* Listings Table */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-base-03">Your Listings</h2>
                    {loading ? (
                        <Skeleton className="h-64 rounded-2xl bg-base-2" />
                    ) : (
                        <ListingsTable
                            items={items}
                            onDelete={(id) => {
                                setItems(prev => prev.filter((i: any) => i.id !== id));
                                setStats(prev => prev ? { ...prev, total_listings: prev.total_listings - 1 } : null);
                            }}
                        />
                    )}
                </div>
            </motion.div>
        </main>
    );
}
