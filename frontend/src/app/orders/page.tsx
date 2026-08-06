'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Package, TrendingUp, ShoppingBag } from 'lucide-react';
import api, { unwrap } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/layout/page-header';
import { cn } from '@/lib/utils';

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
    PENDING: 'bg-warning/10 text-warning border-warning/20',
    PAID: 'bg-primary/10 text-primary border-primary/20',
    SHIPPED: 'bg-secondary/10 text-secondary border-secondary/20',
    DELIVERED: 'bg-success/10 text-success border-success/20',
    CANCELLED: 'bg-error/10 text-error border-error/20',
};

const STATUS_LABELS = {
    PENDING: 'Pending Payment',
    PAID: 'Paid',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
};

function OrdersContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { clearCart } = useCart();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'purchases' | 'sales'>('purchases');
    const [currentUsername, setCurrentUsername] = useState<string | null>(null);
    const justPaid = searchParams.get('success') === 'true';

    useEffect(() => {
        if (justPaid) {
            clearCart();
            router.replace('/orders');
        }
    }, [justPaid, clearCart, router]);

    useEffect(() => {
        setCurrentUsername(localStorage.getItem('username'));

        const fetchOrders = async () => {
            try {
                const response = await api.get('/api/orders/');
                setOrders(unwrap<Order>(response));
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
            <div className="flex min-h-screen items-center justify-center bg-background pt-20">
                <div className="text-muted-foreground">Loading orders...</div>
            </div>
        );
    }

    return (
        <PageShell>
            {justPaid && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <Alert variant="success">
                        <p className="font-semibold">Payment successful</p>
                        <p className="text-sm">Your order is confirmed. It may take a moment to appear below.</p>
                    </Alert>
                </motion.div>
            )}

            <PageHeader title="Orders" description="Track your purchases and sales" />

            <div className="mb-8 flex gap-4 border-b border-border">
                <button
                    onClick={() => setActiveTab('purchases')}
                    className={cn(
                        "relative px-6 py-3 font-semibold transition-colors",
                        activeTab === 'purchases' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    <ShoppingBag className="mr-2 inline h-5 w-5" />
                    Purchases ({purchases.length})
                    {activeTab === 'purchases' && (
                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('sales')}
                    className={cn(
                        "relative px-6 py-3 font-semibold transition-colors",
                        activeTab === 'sales' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    <TrendingUp className="mr-2 inline h-5 w-5" />
                    Sales ({sales.length})
                    {activeTab === 'sales' && (
                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                </button>
            </div>

            {displayOrders.length === 0 ? (
                <EmptyState
                    icon={Package}
                    title={`No ${activeTab === 'purchases' ? 'purchases' : 'sales'} yet`}
                    description={activeTab === 'purchases' ? 'Start shopping to see your orders here' : 'List items to start selling'}
                    action={
                        <Button onClick={() => router.push(activeTab === 'purchases' ? '/' : '/sell')}>
                            {activeTab === 'purchases' ? 'Browse Items' : 'List an Item'}
                        </Button>
                    }
                />
            ) : (
                <div className="space-y-4">
                    {displayOrders.map((order) => (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="cursor-pointer rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
                            onClick={() => router.push(`/items/${order.item.id}`)}
                        >
                            <div className="flex gap-6">
                                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-base-2">
                                    {order.item.images && order.item.images.length > 0 ? (
                                        <img
                                            src={order.item.images[0].image}
                                            alt={order.item.title}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                            <Package className="h-8 w-8 text-muted" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <div className="mb-2 flex items-start justify-between">
                                        <div>
                                            <h3 className="mb-1 text-lg font-semibold text-foreground">
                                                {order.item.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                Order #{order.id} • {new Date(order.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-xl font-bold text-foreground">
                                            ₹{parseFloat(order.total_amount).toFixed(2)}
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center gap-3">
                                        <span className={cn(
                                            "rounded-full border px-3 py-1 text-xs font-semibold",
                                            STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]
                                        )}>
                                            {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS]}
                                        </span>
                                        {activeTab === 'purchases' && (
                                            <span className="text-sm text-muted-foreground">
                                                Sold by @{order.item.seller?.username || 'Unknown'}
                                            </span>
                                        )}
                                        {activeTab === 'sales' && (
                                            <span className="text-sm text-muted-foreground">
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
        </PageShell>
    );
}

export default function OrdersPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background pt-20"><div className="text-muted-foreground">Loading orders...</div></div>}>
            <OrdersContent />
        </Suspense>
    );
}
