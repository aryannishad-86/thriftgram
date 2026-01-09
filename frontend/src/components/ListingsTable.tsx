'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

interface Item {
    id: number;
    title: string;
    price: string;
    likes_count: number;
    images: { image: string }[];
    created_at: string;
}

interface ListingsTableProps {
    items: Item[];
    onDelete: (id: number) => void;
}

export default function ListingsTable({ items, onDelete }: ListingsTableProps) {
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        setDeletingId(id);
        try {
            await api.delete(`/api/items/${id}/`);
            onDelete(id);
        } catch (error) {
            console.error('Failed to delete item:', error);
            alert('Failed to delete item');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="rounded-2xl border-2 border-border bg-card overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-base-2 text-base-03 border-b-2 border-border">
                        <tr>
                            <th className="p-4 font-bold">Item</th>
                            <th className="p-4 font-bold">Price</th>
                            <th className="p-4 font-bold">Likes</th>
                            <th className="p-4 font-bold">Date</th>
                            <th className="p-4 font-bold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        <AnimatePresence>
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 rounded-full bg-base-2 flex items-center justify-center mb-4 border-2 border-border">
                                                <span className="text-2xl">🛍️</span>
                                            </div>
                                            <p className="text-lg font-bold text-base-03">No listings yet</p>
                                            <p className="text-sm text-base-02 mt-1">Start selling your pre-loved items today!</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                items.map((item, index) => (
                                    <motion.tr
                                        key={item.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-base-2 transition-colors group"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-base-2 border-2 border-border">
                                                    {item.images[0] ? (
                                                        <Image
                                                            src={item.images[0].image}
                                                            alt={item.title}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-xs text-base-01">
                                                            No Img
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="font-medium text-base-03 group-hover:text-base-03 transition-colors">{item.title}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-base-03 font-semibold">${item.price}</td>
                                        <td className="p-4 text-base-02">{item.likes_count}</td>
                                        <td className="p-4 text-base-02">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-base-03 hover:text-base-03 hover:bg-primary/10"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-error hover:text-error hover:bg-error/10"
                                                    onClick={() => handleDelete(item.id)}
                                                    disabled={deletingId === item.id}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
