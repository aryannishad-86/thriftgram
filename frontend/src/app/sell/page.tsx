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

            await api.post('/items/', data, {
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
        <main className="min-h-screen bg-black selection:bg-primary/30 relative overflow-hidden">
            {/* Dynamic Background Gradient */}
            <div className="absolute inset-0 -z-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black" />

            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat opacity-20 mix-blend-overlay"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop')" }}
            />

            {/* Animated Gradient Mesh */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-primary/10 via-transparent to-accent/10 animate-pulse" />
            <div className="absolute inset-0 -z-10 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            {/* Fluid Background Orbs */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 0],
                    x: [0, 100, 0],
                    y: [0, -50, 0]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/4 left-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]"
            />
            <motion.div
                animate={{
                    scale: [1, 1.5, 1],
                    rotate: [0, -60, 0],
                    x: [0, -100, 0],
                    y: [0, 100, 0]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-1/4 right-1/4 -z-10 h-[600px] w-[600px] rounded-full bg-accent/10 blur-[120px]"
            />

            <div className="container mx-auto max-w-3xl px-4 py-24 relative z-10">
                <div className="mb-12 text-center space-y-4">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/60"
                    >
                        Sell an Item
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-muted-foreground max-w-lg mx-auto"
                    >
                        List your unique finds for the community. Turn your closet into currency.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="rounded-3xl border border-white/10 bg-black/40 p-8 backdrop-blur-2xl shadow-[0_0_60px_-15px_rgba(109,40,217,0.3)] relative group"
                >
                    {/* Subtle Border Glow */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10 blur-xl" />

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Image Upload */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-white/90 ml-1">Photos</label>
                            <ImageUpload onChange={setFiles} />
                        </div>

                        {/* Details */}
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/90 ml-1">Title</label>
                                <Input
                                    required
                                    placeholder="e.g. Vintage Levi's 501"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 text-white placeholder:text-muted-foreground/50 h-12 transition-all duration-300 hover:bg-white/10"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/90 ml-1">Price ($)</label>
                                <Input
                                    required
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 text-white placeholder:text-muted-foreground/50 h-12 transition-all duration-300 hover:bg-white/10"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/90 ml-1">Size</label>
                                <Input
                                    required
                                    placeholder="e.g. M, 32, 10"
                                    value={formData.size}
                                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                                    className="bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 text-white placeholder:text-muted-foreground/50 h-12 transition-all duration-300 hover:bg-white/10"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/90 ml-1">Condition</label>
                                <div className="relative">
                                    <select
                                        className="flex h-12 w-full appearance-none rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:bg-white/10"
                                        value={formData.condition}
                                        onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                    >
                                        <option value="NEW" className="bg-black text-white">New with Tags</option>
                                        <option value="LIKE_NEW" className="bg-black text-white">Like New</option>
                                        <option value="GOOD" className="bg-black text-white">Good</option>
                                        <option value="FAIR" className="bg-black text-white">Fair</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/50">
                                        <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/90 ml-1">Description</label>
                            <textarea
                                required
                                rows={4}
                                placeholder="Describe your item..."
                                className="flex w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:bg-white/10 resize-none"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Button type="submit" className="w-full bg-gradient-to-r from-primary via-purple-600 to-accent hover:opacity-90 text-white font-medium py-6 shadow-lg shadow-primary/25 transition-all" disabled={loading}>
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        Listing Item...
                                    </div>
                                ) : 'List Item'}
                            </Button>
                        </motion.div>
                    </form>
                </motion.div>
            </div>
        </main>
    );
}
