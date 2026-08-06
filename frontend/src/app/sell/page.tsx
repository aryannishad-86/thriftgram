'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/field';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import ImageUpload from '@/components/ImageUpload';

export default function SellPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
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
        setError('');

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
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            router.push('/');
        } catch (err) {
            console.error('Failed to create item:', err);
            setError('Failed to create item. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="relative min-h-screen overflow-hidden bg-background selection:bg-primary/20">
            <div className="container relative z-10 mx-auto max-w-3xl px-4 py-24">
                <div className="mb-12 space-y-4 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="font-display text-5xl font-semibold tracking-tight text-foreground"
                    >
                        Sell an Item
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mx-auto max-w-lg text-lg text-muted-foreground"
                    >
                        List your unique finds for the community. Turn your closet into currency.
                    </motion.p>
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
                    <Card padding="lg">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <Field label="Photos">
                                <ImageUpload onChange={setFiles} />
                            </Field>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <Field label="Title">
                                    <Input
                                        required
                                        placeholder="e.g. Vintage Levi's 501"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </Field>

                                <Field label="Price (₹)">
                                    <Input
                                        required
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </Field>

                                <Field label="Size">
                                    <Input
                                        required
                                        placeholder="e.g. M, 32, 10"
                                        value={formData.size}
                                        onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                                    />
                                </Field>

                                <Field label="Condition">
                                    <Select
                                        value={formData.condition}
                                        onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                    >
                                        <option value="NEW">New with Tags</option>
                                        <option value="LIKE_NEW">Like New</option>
                                        <option value="GOOD">Good</option>
                                        <option value="FAIR">Fair</option>
                                    </Select>
                                </Field>
                            </div>

                            <Field label="Description">
                                <Textarea
                                    required
                                    rows={4}
                                    placeholder="Describe your item..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </Field>

                            {error && <Alert variant="error">{error}</Alert>}

                            <div className="flex justify-center pt-4">
                                <Button type="submit" size="lg" loading={loading}>
                                    {loading ? 'Listing Item...' : (
                                        <>
                                            List Item
                                            <ArrowRight className="h-5 w-5" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </motion.div>
            </div>
        </main>
    );
}
