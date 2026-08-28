'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Package } from 'lucide-react';
import api, { unwrap } from '@/lib/api';
import { cloudinaryUrl, isCloudinary } from '@/lib/cloudinary';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Tabs } from '@/components/ui/tabs';
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
    const [loadFailed, setLoadFailed] = useState(false);
    const [activeTab, setActiveTab] = useState<'purchases' | 'sales'>('purchases');
    const [currentUsername, setCurrentUsername] = useState<string | null>(null);
    const justPaid = searchParams.get('success') === 'true';

    useEffect(() => {
        if (justPaid) {
            clearCart();
            router.replace('/orders');
        }
    }, [justPaid, clearCart, router]);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setLoadFailed(false);
        try {
            const response = await api.get('/api/orders/');
            setOrders(unwrap<Order>(response));
        } catch (err) {
            console.error('Failed to fetch orders', err);
            setLoadFailed(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setCurrentUsername(localStorage.getItem('username'));
        fetchOrders();
    }, [fetchOrders]);

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

            <Tabs
                className="mb-8"
                value={activeTab}
                onChange={setActiveTab}
                items={[
                    { value: 'purchases', label: 'Purchases', count: purchases.length },
                    { value: 'sales', label: 'Sales', count: sales.length },
                ]}
            />

            {loadFailed ? (
                <ErrorState subject="your orders" onRetry={fetchOrders} />
            ) : displayOrders.length === 0 ? (
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
                            className="cursor-pointer rounded-none border border-border bg-card p-6 transition-shadow hover:shadow-md"
                            onClick={() => router.push(`/items/${order.item.id}`)}
                        >
                            <div className="flex gap-6">
                                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden bg-base-2">
                                    {order.item.images && order.item.images.length > 0 ? (
                                        <Image
                                            src={cloudinaryUrl(order.item.images[0].image, { width: 200, aspect: '1:1' })}
                                            alt={order.item.title}
                                            fill
                                            sizes="96px"
                                            unoptimized={isCloudinary(order.item.images[0].image)}
                                            className="object-cover"
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
                                        <div className="font-mono text-xl text-foreground">
                                            ₹{parseFloat(order.total_amount).toFixed(2)}
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center gap-3">
                                        <span className={cn(
                                            "label-meta border px-3 py-1",
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
