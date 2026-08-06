'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shirt, Upload } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/layout/page-header';

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

    useEffect(() => {
        fetchCloset();
    }, []);

    const fetchCloset = async () => {
        try {
            const res = await api.get('/api/closet/');
            const itemsData = res.data.results ?? res.data;
            setItems(Array.isArray(itemsData) ? itemsData : []);
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
        <PageShell>
            <PageHeader
                title="My Digital Closet"
                description="Digitize your wardrobe & find matches."
                action={
                    <Button className="relative overflow-hidden">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="absolute inset-0 z-10 cursor-pointer opacity-0"
                            disabled={uploading}
                        />
                        <Upload className="h-5 w-5" />
                        {uploading ? 'Uploading...' : 'Add Item'}
                    </Button>
                }
            />

            {loading ? (
                <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-5">
                    {[...Array(10)].map((_, i) => (
                        <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <EmptyState
                    icon={Shirt}
                    title="Your closet is empty"
                    description="Upload photos of your clothes to start matching outfits!"
                />
            ) : (
                <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-5">
                    {items.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary"
                        >
                            <img
                                src={item.image}
                                alt={item.category}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                                <span className="font-bold text-white">{item.category}</span>
                                <span className="text-sm text-white/60">{item.color || 'Unknown Color'}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </PageShell>
    );
}
