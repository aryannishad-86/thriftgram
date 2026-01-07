'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Package, TrendingUp, ShoppingBag, Clock } from 'lucide-react';
import api from '@/lib/api';

interface Order {
    id: number;
    buyer: {
        username: string;
        profile_picture: string | null;
    };
    item: {
        id: number;
        title: string;
        price: string;
        images: Array<{ image: string }>;
        seller: {
            username: string;
        };
    };
    status: string;
    total_amount: string;
    created_at: string;
}

const STATUS_COLORS = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    PAID: 'bg-blue-100 text-blue-800 border-blue-200',
    SHIPPED: 'bg-purple-100 text-purple-800 border-purple-200',
    DELIVERED: 'bg-green-100 text-green-800 border-green-200',
    CANCELLED: 'bg-red-100 text-red-800 border-red-200',
};

const STATUS_LABELS = {
    PENDING: 'Pending Payment',
    PAID: 'Paid',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
};

export default function OrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'purchases' | 'sales'>('purchases');
    const [currentUsername, setCurrentUsername] = useState<string | null>(null);

    useEffect(() => {
        // Get username from localStorage (client-side only)
        setCurrentUsername(localStorage.getItem('username'));

        const fetchOrders = async () => {
            try {
                const response = await api.get('/api/orders/');
                setOrders(response.data);
            } catch (err) {
                console.error('Failed to fetch orders', err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const purchases = orders.filter(order => order.buyer.username === currentUsername);
    const sales = orders.filter(order => order.item && order.buyer.username !== currentUsername);

    const displayOrders = activeTab === 'purchases' ? purchases : sales;

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center pt-20">
                <div className="text-base-02">Loading orders...</div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-background pt-24 pb-12 px-4">
            <div className="container mx-auto max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-base-03 mb-2">Orders</h1>
                    <p className="text-base-02">Track your purchases and sales</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-border">
                    <button
                        onClick={() => setActiveTab('purchases')}
                        className={`px-6 py-3 font-semibold transition-colors relative ${activeTab === 'purchases'
                            ? 'text-primary'
                            : 'text-base-02 hover:text-base-03'
                            }`}
                    >
                        <ShoppingBag className="w-5 h-5 inline mr-2" />
                        Purchases ({purchases.length})
                        {activeTab === 'purchases' && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                            />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('sales')}
                        className={`px-6 py-3 font-semibold transition-colors relative ${activeTab === 'sales'
                            ? 'text-primary'
                            : 'text-base-02 hover:text-base-03'
                            }`}
                    >
                        <TrendingUp className="w-5 h-5 inline mr-2" />
                        Sales ({sales.length})
                        {activeTab === 'sales' && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                            />
                        )}
                    </button>
                </div>

                {/* Orders List */}
                {displayOrders.length === 0 ? (
                    <div className="text-center py-16">
                        <Package className="w-16 h-16 text-base-01 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-base-03 mb-2">
                            No {activeTab === 'purchases' ? 'purchases' : 'sales'} yet
                        </h3>
                        <p className="text-base-02 mb-6">
                            {activeTab === 'purchases'
                                ? 'Start shopping to see your orders here'
                                : 'List items to start selling'}
                        </p>
                        <button
                            onClick={() => router.push(activeTab === 'purchases' ? '/' : '/sell')}
                            className="px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
                        >
                            {activeTab === 'purchases' ? 'Browse Items' : 'List an Item'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayOrders.map((order) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => router.push(`/items/${order.item.id}`)}
                            >
                                <div className="flex gap-6">
                                    {/* Item Image */}
                                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-base-2 flex-shrink-0">
                                        {order.item.images && order.item.images.length > 0 ? (
                                            <img
                                                src={order.item.images[0].image}
                                                alt={order.item.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package className="w-8 h-8 text-base-01" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Order Details */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="text-lg font-semibold text-base-03 mb-1">
                                                    {order.item.title}
                                                </h3>
                                                <p className="text-sm text-base-02">
                                                    Order #{order.id} • {new Date(order.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xl font-bold text-base-03">
                                                    ${parseFloat(order.total_amount).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="flex items-center gap-3 mt-3">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]
                                                    }`}
                                            >
                                                {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS]}
                                            </span>
                                            {activeTab === 'purchases' && (
                                                <span className="text-sm text-base-02">
                                                    Sold by @{order.item.seller?.username || 'Unknown'}
                                                </span>
                                            )}
                                            {activeTab === 'sales' && (
                                                <span className="text-sm text-base-02">
                                                    Purchased by @{order.buyer.username}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
