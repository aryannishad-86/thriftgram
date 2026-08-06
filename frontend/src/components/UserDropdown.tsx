'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, LogOut, UserCircle, ShoppingBag, Heart } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface UserDropdownProps {
    username: string;
}

export default function UserDropdown({ username }: UserDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('username');
        window.location.href = '/login';
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Account menu"
                className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-base-2 focus:outline-none"
            >
                <User className="h-5 w-5" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg"
                    >
                        <div className="border-b border-border px-4 py-2">
                            <p className="truncate text-sm font-medium text-foreground">@{username}</p>
                        </div>

                        <Link
                            href={`/profile/${username}`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-foreground/80 transition-colors hover:bg-base-2 hover:text-foreground"
                            onClick={() => setIsOpen(false)}
                        >
                            <UserCircle className="h-4 w-4" />
                            Profile
                        </Link>

                        <Link
                            href="/orders"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-foreground/80 transition-colors hover:bg-base-2 hover:text-foreground"
                            onClick={() => setIsOpen(false)}
                        >
                            <ShoppingBag className="h-4 w-4" />
                            Orders
                        </Link>

                        <Link
                            href="/wishlist"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-foreground/80 transition-colors hover:bg-base-2 hover:text-foreground"
                            onClick={() => setIsOpen(false)}
                        >
                            <Heart className="h-4 w-4" />
                            Wishlist
                        </Link>

                        <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-error transition-colors hover:bg-error/5"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
