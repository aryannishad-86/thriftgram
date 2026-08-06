'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, DollarSign, Leaf, Droplets, Heart } from 'lucide-react';
import api from '@/lib/api';
import StatsCard from '@/components/StatsCard';
import ListingsTable from '@/components/ListingsTable';
import { Skeleton } from '@/components/ui/skeleton';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/layout/page-header';
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
                const token = localStorage.getItem('access_token');
                if (!token) {
                    router.push('/login');
                    return;
                }

                const userRes = await api.get('/api/users/me/');
                setUser(userRes.data);

                const statsRes = await api.get('/api/users/dashboard_stats/');
                setStats(statsRes.data);

                if (statsRes.data.username) {
                    const itemsRes = await api.get('/api/items/', {
                        params: { seller_username: statsRes.data.username }
                    });
                    const itemsData = itemsRes.data.results ?? itemsRes.data;
                    setItems(Array.isArray(itemsData) ? itemsData : []);
                }
            } catch (error) {
                console.error('Failed to load dashboard data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    return (
        <PageShell>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
            >
                <PageHeader title="Seller Dashboard" description="Overview of your store performance" />

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-32 rounded-2xl" />
                        ))
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

                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-foreground">Your Listings</h2>
                    {loading ? (
                        <Skeleton className="h-64 rounded-2xl" />
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
        </PageShell>
    );
}
