'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Leaf, Droplets, User as UserIcon } from 'lucide-react';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

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
                const res = await api.get('/leaderboard/');
                setUsers(res.data);
            } catch (error) {
                console.error('Failed to fetch leaderboard', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    return (
        <main className="min-h-screen bg-background selection:bg-base-03/20 pt-24 pb-12 px-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 -z-10 bg-base-3" />

            <div className="container mx-auto max-w-4xl">
                <div className="text-center mb-12">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-bold text-base-03 mb-4"
                    >
                        Eco Champions
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-base-02"
                    >
                        Top savers of the planet 🌍
                    </motion.p>
                </div>

                <div className="rounded-3xl border-2 border-border overflow-hidden shadow-md" style={{ backgroundColor: '#F7F1E3' }}>
                    <div className="p-6 border-b-2 border-border flex justify-between items-center bg-base-2">
                        <div className="font-bold text-base-03">Rank</div>
                        <div className="font-bold text-base-03 flex-1 ml-8">User</div>
                        <div className="font-bold text-base-03">Eco-Points</div>
                    </div>

                    {loading ? (
                        <div className="p-6 space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full bg-base-2 rounded-xl" />
                            ))}
                        </div>
                    ) : (
                        <div className="divide-y-2 divide-border">
                            {users.map((user, index) => (
                                <motion.div
                                    key={user.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="p-6 flex items-center hover:bg-base-2 transition-colors"
                                >
                                    <div className="w-8 font-bold text-2xl text-base-03">
                                        {index + 1 === 1 ? '🥇' : index + 1 === 2 ? '🥈' : index + 1 === 3 ? '🥉' : `#${index + 1}`}
                                    </div>

                                    <div className="flex-1 ml-8 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-base-03 p-[2px]">
                                            <div className="w-full h-full rounded-full bg-base-2 overflow-hidden relative">
                                                {user.profile_picture ? (
                                                    <img src={user.profile_picture} alt={user.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-base-2 text-base-03">
                                                        <UserIcon className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="font-bold text-base-03 text-lg">{user.username}</div>
                                            <div className="text-xs text-base-02 flex gap-3">
                                                <span className="flex items-center gap-1"><Leaf className="w-3 h-3" /> {user.co2_saved}kg CO₂</span>
                                                <span className="flex items-center gap-1"><Droplets className="w-3 h-3" /> {user.water_saved}L Water</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="font-bold text-2xl text-base-03 font-mono">
                                        {user.eco_points}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
