'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Droplets } from 'lucide-react';
import api, { unwrap } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Avatar } from '@/components/ui/avatar';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/layout/page-header';

interface User {
    id: number;
    username: string;
    profile_picture: string | null;
    eco_points: number;
    co2_saved: number;
    water_saved: number;
}

export default function LeaderboardPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);

    const fetchLeaderboard = useCallback(async () => {
        setLoading(true);
        setLoadFailed(false);
        try {
            const res = await api.get('/api/leaderboard/');
            setUsers(unwrap<User>(res));
        } catch (error) {
            console.error('Failed to fetch leaderboard', error);
            setLoadFailed(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    return (
        <PageShell maxWidth="4xl" className="selection:bg-primary/20">
            <PageHeader
                title="Eco Champions"
                description="Top savers of the planet 🌍"
                size="lg"
                align="center"
            />

            {/* The scoreboard voice: a wall label header row, not bold sans —
                this is where the mono/uppercase/tracked treatment earns its
                keep the most in the whole app. */}
            <div className="overflow-hidden border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border bg-base-2 p-6">
                    <div className="label-meta w-8 text-muted">Rank</div>
                    <div className="label-meta ml-8 flex-1 text-muted">Thrifter</div>
                    <div className="label-meta text-muted">Eco-Points</div>
                </div>

                {loading ? (
                    <div className="space-y-4 p-6">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full rounded-none" />
                        ))}
                    </div>
                ) : loadFailed ? (
                    <ErrorState subject="the leaderboard" onRetry={fetchLeaderboard} />
                ) : users.length === 0 ? (
                    <EmptyState
                        icon={Leaf}
                        title="No champions yet"
                        description="Eco-points are earned by listing and buying pre-loved items. Be the first on the board."
                    />
                ) : (
                    <div className="divide-y divide-border">
                        {users.map((user, index) => (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center p-6 transition-colors hover:bg-base-2"
                            >
                                <div className="w-8 font-mono text-2xl text-foreground">
                                    {index + 1 === 1 ? '🥇' : index + 1 === 2 ? '🥈' : index + 1 === 3 ? '🥉' : `#${index + 1}`}
                                </div>

                                <div className="ml-8 flex flex-1 items-center gap-4">
                                    <Avatar src={user.profile_picture} name={user.username} size="md" />
                                    <div>
                                        <div className="font-display text-lg font-semibold text-foreground">{user.username}</div>
                                        <div className="flex gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1"><Leaf className="h-3 w-3" /> {user.co2_saved}kg CO₂</span>
                                            <span className="flex items-center gap-1"><Droplets className="h-3 w-3" /> {user.water_saved}L Water</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={`font-mono text-2xl font-bold ${index === 0 ? 'text-primary' : 'text-foreground'}`}>
                                    {user.eco_points}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </PageShell>
    );
}
