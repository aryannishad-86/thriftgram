'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, Flame, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import CountdownTimer from '@/components/CountdownTimer';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface DropEvent {
    id: number;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    image: string;
    items: number[]; // IDs of items
}

export default function DropsPage() {
    const [drops, setDrops] = useState<DropEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeDrop, setActiveDrop] = useState<DropEvent | null>(null);

    useEffect(() => {
        fetchDrops();
    }, []);

    const fetchDrops = async () => {
        try {
            const res = await api.get('/drops/');
            setDrops(res.data);

            // Check for currently active drop
            const now = new Date();
            const active = res.data.find((d: DropEvent) => {
                const start = new Date(d.start_time);
                const end = new Date(d.end_time);
                return now >= start && now <= end;
            });
            setActiveDrop(active || null);

        } catch (error) {
            console.error('Failed to fetch drops', error);
        } finally {
            setLoading(false);
        }
    };

    // Get next upcoming drop
    const nextDrop = drops.find(d => new Date(d.start_time) > new Date());

    return (
        <main className="min-h-screen bg-black selection:bg-red-500/30 pt-24 pb-12 px-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-black to-black" />
            <div className="absolute inset-0 -z-10 bg-[url('/grid.svg')] opacity-20" />

            <div className="container mx-auto max-w-6xl">

                {/* Hero Section */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mb-6"
                    >
                        <Flame className="w-4 h-4 animate-pulse" />
                        <span className="font-bold tracking-wider text-sm">LIVE DROPS</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-5xl md:text-8xl font-black text-white mb-6 tracking-tighter"
                    >
                        NEXT DROP IN
                    </motion.h1>

                    {loading ? (
                        <Skeleton className="h-40 w-full max-w-3xl mx-auto rounded-3xl bg-white/5" />
                    ) : nextDrop ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <CountdownTimer targetDate={nextDrop.start_time} onComplete={fetchDrops} />
                            <div className="mt-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-white">{nextDrop.title}</h2>
                                <p className="text-white/60 mt-2 max-w-xl mx-auto">{nextDrop.description}</p>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="py-20">
                            <h2 className="text-3xl font-bold text-white/40">No upcoming drops scheduled.</h2>
                            <p className="text-white/30 mt-2">Check back soon for exclusive collections.</p>
                        </div>
                    )}
                </div>

                {/* Active Drop Section */}
                {activeDrop && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-20 border border-red-500/30 bg-gradient-to-b from-red-900/20 to-black rounded-3xl p-8 md:p-12 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 bg-red-600 text-white px-6 py-2 rounded-bl-3xl font-bold animate-pulse">
                            LIVE NOW
                        </div>

                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-4xl font-bold text-white mb-4">{activeDrop.title}</h2>
                                <p className="text-lg text-white/80 mb-8">{activeDrop.description}</p>
                                <Button asChild className="bg-red-600 hover:bg-red-700 text-white h-14 px-8 rounded-full text-lg font-bold">
                                    <Link href={`/search?drop=${activeDrop.id}`}>
                                        Shop Collection <ArrowRight className="ml-2 w-5 h-5" />
                                    </Link>
                                </Button>
                            </div>
                            <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10">
                                {activeDrop.image ? (
                                    <img src={activeDrop.image} alt={activeDrop.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/20">
                                        No Cover Image
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Upcoming Drops Grid */}
                {drops.length > 0 && (
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                            <Calendar className="w-6 h-6 text-white/60" /> Upcoming Schedule
                        </h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {drops.filter(d => d.id !== activeDrop?.id && d.id !== nextDrop?.id).map((drop) => (
                                <div key={drop.id} className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors">
                                    <div className="aspect-video bg-black/40 relative">
                                        {drop.image && <img src={drop.image} alt={drop.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 text-white font-mono text-sm">
                                                {new Date(drop.start_time).toLocaleDateString()} • {new Date(drop.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <h4 className="text-xl font-bold text-white mb-2">{drop.title}</h4>
                                        <p className="text-white/60 text-sm line-clamp-2">{drop.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
