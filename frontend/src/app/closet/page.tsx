'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Shirt, Upload, X } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

interface ClosetItem {
    id: number;
    image: string;
    category: string;
    color: string;
    is_private: boolean;
}

export default function ClosetPage() {
    const [items, setItems] = useState<ClosetItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchCloset();
    }, []);

    const fetchCloset = async () => {
        try {
            const res = await api.get('/api/closet/');
            setItems(res.data);
        } catch (error) {
            console.error('Failed to fetch closet', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('image', file);
        formData.append('category', 'TOP'); // Default for now, could add a selector
        formData.append('is_private', 'true');

        setUploading(true);
        try {
            await api.post('/api/closet/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            fetchCloset();
        } catch (error) {
            console.error('Failed to upload item', error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <main className="min-h-screen bg-black selection:bg-purple-500/30 pt-24 pb-12 px-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black" />

            <div className="container mx-auto max-w-6xl">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-6xl font-bold text-white mb-4"
                        >
                            My Digital Closet
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-purple-400"
                        >
                            Digitize your wardrobe & find matches.
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Button className="relative overflow-hidden bg-white text-black hover:bg-white/90 rounded-full px-6 py-6 text-lg font-bold group">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                disabled={uploading}
                            />
                            {uploading ? (
                                <span className="animate-pulse">Uploading...</span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Upload className="w-5 h-5" /> Add Item
                                </span>
                            )}
                        </Button>
                    </motion.div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {[...Array(10)].map((_, i) => (
                            <Skeleton key={i} className="aspect-[3/4] rounded-2xl bg-white/5" />
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                        <Shirt className="w-16 h-16 text-white/20 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-white mb-2">Your closet is empty</h3>
                        <p className="text-muted-foreground">Upload photos of your clothes to start matching outfits!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {items.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-purple-500/50 transition-colors"
                            >
                                <img
                                    src={item.image}
                                    alt={item.category}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                                    <span className="text-white font-bold">{item.category}</span>
                                    <span className="text-white/60 text-sm">{item.color || 'Unknown Color'}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
