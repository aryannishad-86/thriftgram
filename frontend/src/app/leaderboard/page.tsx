'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Droplets, User as UserIcon } from 'lucide-react';
import api, { unwrap } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
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

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await api.get('/api/leaderboard/');
                setUsers(unwrap<User>(res));
            } catch (error) {
                console.error('Failed to fetch leaderboard', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    return (
        <PageShell maxWidth="4xl" className="selection:bg-primary/20">
            <PageHeader
                title="Eco Champions"
                description="Top savers of the planet 🌍"
                size="lg"
                align="center"
            />

            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-md">
                <div className="flex items-center justify-between border-b border-border bg-base-2 p-6">
                    <div className="font-bold text-foreground">Rank</div>
                    <div className="ml-8 flex-1 font-bold text-foreground">User</div>
                    <div className="font-bold text-foreground">Eco-Points</div>
                </div>

                {loading ? (
                    <div className="space-y-4 p-6">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full rounded-xl" />
                        ))}
                    </div>
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
                                <div className="w-8 text-2xl font-bold text-foreground">
                                    {index + 1 === 1 ? '🥇' : index + 1 === 2 ? '🥈' : index + 1 === 3 ? '🥉' : `#${index + 1}`}
                                </div>

                                <div className="ml-8 flex flex-1 items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-ink p-[2px]">
                                        <div className="relative h-full w-full overflow-hidden rounded-full bg-base-2">
                                            {user.profile_picture ? (
                                                <img src={user.profile_picture} alt={user.username} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-base-2 text-foreground">
                                                    <UserIcon className="h-6 w-6" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-foreground">{user.username}</div>
                                        <div className="flex gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1"><Leaf className="h-3 w-3" /> {user.co2_saved}kg CO₂</span>
                                            <span className="flex items-center gap-1"><Droplets className="h-3 w-3" /> {user.water_saved}L Water</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="font-mono text-2xl font-bold text-foreground">
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
