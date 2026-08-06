'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Leaf, ShoppingBag, User as UserIcon, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificationBell from './NotificationBell';
import UserDropdown from './UserDropdown';
import { useCart } from '@/context/CartContext';
import api from '@/lib/api';

interface NavActionsProps {
    username: string | null;
}

export default function NavActions({ username }: NavActionsProps) {
    const { openCart, items } = useCart();
    const [ecoPoints, setEcoPoints] = useState<number | null>(null);

    useEffect(() => {
        if (!username) return;
        api.get('/api/users/me/').then((res) => {
            setEcoPoints(res.data.eco_points ?? null);
        }).catch(() => {});
    }, [username]);

    return (
        <div className="flex items-center gap-3">
            <Button asChild size="sm">
                <Link href="/sell">
                    <Plus className="h-4 w-4" /> Sell Item
                </Link>
            </Button>

            {username && ecoPoints !== null && (
                <Link
                    href="/leaderboard"
                    className="hidden items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-base-2 md:flex"
                >
                    <Leaf className="h-3.5 w-3.5 text-success" />
                    <span>{ecoPoints}</span>
                </Link>
            )}

            <NotificationBell />

            <button
                onClick={openCart}
                aria-label="Cart"
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-base-2"
            >
                <ShoppingBag className="h-5 w-5" />
                {items.length > 0 && (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error" />
                )}
            </button>

            {username ? (
                <UserDropdown username={username} />
            ) : (
                <Link href="/login" className="p-2 text-muted transition-colors hover:text-foreground">
                    <UserIcon className="h-6 w-6" />
                </Link>
            )}

            <Link href="/sell" className="p-2 text-muted transition-colors hover:text-foreground md:hidden">
                <PlusCircle className="h-6 w-6" />
            </Link>
        </div>
    );
}
