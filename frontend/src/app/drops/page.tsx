'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Flame, ArrowRight } from 'lucide-react';
import api, { unwrap } from '@/lib/api';
import { Button } from '@/components/ui/button';
import CountdownTimer from '@/components/CountdownTimer';
import { Skeleton } from '@/components/ui/skeleton';
import { PageShell } from '@/components/layout/page-shell';
import Link from 'next/link';

interface DropEvent {
    id: number;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    image: string;
    items: number[];
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
            const res = await api.get('/api/drops/');
            const dropList = unwrap<DropEvent>(res);
            setDrops(dropList);

            const now = new Date();
            const active = dropList.find((d: DropEvent) => {
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

    const nextDrop = drops.find(d => new Date(d.start_time) > new Date());

    return (
        <PageShell>
            <div className="mb-16 text-center">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 inline-flex items-center gap-2 rounded-full border border-error/20 bg-error/10 px-4 py-2 text-error"
                >
                    <Flame className="h-4 w-4 animate-pulse" />
                    <span className="text-sm font-bold tracking-wider">LIVE DROPS</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="font-display mb-6 text-5xl font-semibold tracking-tight text-foreground md:text-8xl"
                >
                    Next Drop In
                </motion.h1>

                {loading ? (
                    <Skeleton className="mx-auto h-40 w-full max-w-3xl rounded-3xl" />
                ) : nextDrop ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <CountdownTimer targetDate={nextDrop.start_time} onComplete={fetchDrops} />
                        <div className="mt-8">
                            <h2 className="text-2xl font-bold text-foreground md:text-3xl">{nextDrop.title}</h2>
                            <p className="mx-auto mt-2 max-w-xl text-muted-foreground">{nextDrop.description}</p>
                        </div>
                    </motion.div>
                ) : (
                    <div className="py-20">
                        <h2 className="text-3xl font-bold text-foreground">No upcoming drops scheduled.</h2>
                        <p className="mt-2 text-muted">Check back soon for exclusive collections.</p>
                    </div>
                )}
            </div>

            {/* Deliberate solid-ink promotional panel — high-contrast emphasis
                for a "live now" callout, not a glass-on-light mistake. */}
            {activeDrop && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative mb-20 overflow-hidden rounded-3xl bg-ink p-8 md:p-12"
                >
                    <div className="absolute right-0 top-0 rounded-bl-3xl bg-error px-6 py-2 font-bold text-white">
                        LIVE NOW
                    </div>

                    <div className="grid items-center gap-12 md:grid-cols-2">
                        <div>
                            <h2 className="mb-4 text-4xl font-bold text-white">{activeDrop.title}</h2>
                            <p className="mb-8 text-lg text-white/70">{activeDrop.description}</p>
                            <Button asChild variant="danger" size="lg">
                                <Link href={`/?drop=${activeDrop.id}#feed`}>
                                    Shop Collection <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                        </div>
                        <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10">
                            {activeDrop.image ? (
                                <img src={activeDrop.image} alt={activeDrop.title} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-white/5 text-white/30">
                                    No Cover Image
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {drops.length > 0 && (
                <div>
                    <h3 className="mb-8 flex items-center gap-3 text-2xl font-bold text-foreground">
                        <Calendar className="h-6 w-6 text-muted" /> Upcoming Schedule
                    </h3>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {drops.filter(d => d.id !== activeDrop?.id && d.id !== nextDrop?.id).map((drop) => (
                            <div key={drop.id} className="group overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary">
                                <div className="relative aspect-video bg-base-2">
                                    {drop.image && (
                                        <img src={drop.image} alt={drop.title} className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100" />
                                    )}
                                    {/* Genuine glass-over-photo: a date chip floating on the cover image */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="glass-dark rounded-full px-4 py-2 font-mono text-sm text-white">
                                            {new Date(drop.start_time).toLocaleDateString()} • {new Date(drop.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h4 className="mb-2 text-xl font-bold text-foreground">{drop.title}</h4>
                                    <p className="line-clamp-2 text-sm text-muted-foreground">{drop.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </PageShell>
    );
}
