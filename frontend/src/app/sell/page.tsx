'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ImageUpload from '@/components/ImageUpload';

export default function SellPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        price: '',
        size: '',
        condition: 'GOOD',
        description: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('price', formData.price);
            data.append('size', formData.size);
            data.append('condition', formData.condition);
            data.append('description', formData.description);

            files.forEach((file) => {
                data.append('uploaded_images', file);
            });

            await api.post('/api/items/', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            router.push('/');
        } catch (err) {
            console.error('Failed to create item:', err);
            alert('Failed to create item. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background selection:bg-primary/20 relative overflow-hidden">
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 -z-30 bg-base-3" />
            <div className="absolute inset-0 -z-20 bg-[url('/grid.svg')] bg-center opacity-[0.03]" />

            <div className="container mx-auto max-w-3xl px-4 py-24 relative z-10">
                <div className="mb-12 text-center space-y-4">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-5xl font-bold tracking-tight text-base-03"
                    >
                        Sell an Item
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-base-02 max-w-lg mx-auto"
                    >
                        List your unique finds for the community. Turn your closet into currency.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="rounded-2xl border-2 border-border p-8 shadow-md relative"
                    style={{ backgroundColor: "#F7F1E3" }}
                >
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Image Upload */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-base-03 ml-1">Photos</label>
                            <ImageUpload onChange={setFiles} />
                        </div>

                        {/* Details */}
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-base-03 ml-1">Title</label>
                                <Input
                                    required
                                    placeholder="e.g. Vintage Levi's 501"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="bg-background border-border focus:border-primary text-base-03 placeholder:text-muted h-12 transition-all duration-300 hover:border-primary/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-base-03 ml-1">Price (₹)</label>
                                <Input
                                    required
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="bg-background border-border focus:border-primary text-base-03 placeholder:text-muted h-12 transition-all duration-300 hover:border-primary/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-base-03 ml-1">Size</label>
                                <Input
                                    required
                                    placeholder="e.g. M, 32, 10"
                                    value={formData.size}
                                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                                    className="bg-background border-border focus:border-primary text-base-03 placeholder:text-muted h-12 transition-all duration-300 hover:border-primary/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-base-03 ml-1">Condition</label>
                                <div className="relative">
                                    <select
                                        className="flex h-12 w-full appearance-none rounded-md border border-border bg-background px-3 py-2 text-sm text-base-03 ring-offset-background placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:border-primary/50"
                                        value={formData.condition}
                                        onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                    >
                                        <option value="NEW" className="bg-card text-base-03">New with Tags</option>
                                        <option value="LIKE_NEW" className="bg-card text-base-03">Like New</option>
                                        <option value="GOOD" className="bg-card text-base-03">Good</option>
                                        <option value="FAIR" className="bg-card text-base-03">Fair</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted">
                                        <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-base-03 ml-1">Description</label>
                            <textarea
                                required
                                rows={4}
                                placeholder="Describe your item..."
                                className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-base-03 ring-offset-background placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:border-primary/50 resize-none"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="flex justify-center pt-4">
                            <motion.div
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            >
                                <Button 
                                    type="submit" 
                                    className="bg-base-03 hover:bg-base-03/90 text-white font-bold py-6 px-12 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-base-03" 
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            Listing Item...
                                        </div>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            List Item
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </span>
                                    )}
                                </Button>
                            </motion.div>
                        </div>
                    </form>
                </motion.div>
            </div>
        </main>
    );
}
