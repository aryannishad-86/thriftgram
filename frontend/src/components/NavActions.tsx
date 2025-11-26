import Link from 'next/link';
import { Plus, Leaf, ShoppingBag, User as UserIcon, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificationBell from './NotificationBell';
import UserDropdown from './UserDropdown';
import { useCart } from '@/context/CartContext';

interface NavActionsProps {
    username: string | null;
}

export default function NavActions({ username }: NavActionsProps) {
    const { openCart, items } = useCart();

    return (
        <div className="flex items-center gap-4">
            <Button asChild className="bg-white text-black hover:bg-white/90 rounded-full font-bold transition-all hover:scale-105">
                <Link href="/sell">
                    <Plus className="h-4 w-4 mr-2" /> Sell Item
                </Link>
            </Button>

            {/* Eco Points Badge */}
            <Link href="/leaderboard" className="hidden md:flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full text-green-400 text-sm font-bold hover:bg-green-500/20 transition-colors">
                <Leaf className="w-3.5 h-3.5" />
                <span>[★ 350]</span>
            </Link>

            <NotificationBell />

            <button
                onClick={openCart}
                className="relative p-2 text-muted-foreground hover:text-primary transition-colors"
            >
                <ShoppingBag className="h-6 w-6" />
                {items.length > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                        {items.length}
                    </span>
                )}
            </button>

            {username ? (
                <UserDropdown username={username} />
            ) : (
                <Link href="/login" className="p-2 text-muted-foreground hover:text-primary transition-colors">
                    <UserIcon className="h-6 w-6" />
                </Link>
            )}

            <Link href="/sell" className="md:hidden p-2 text-muted-foreground hover:text-primary transition-colors">
                <PlusCircle className="h-6 w-6" />
            </Link>
        </div>
    );
}

