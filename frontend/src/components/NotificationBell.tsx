'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import api, { unwrap } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Notification {
    id: number;
    message: string;
    type: 'like' | 'message' | 'follow';
    is_read: boolean;
    created_at: string;
}

const POLL_MS = 30000;

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Poll every 30s (WebSockets aren't available on the WSGI backend). Pause
    // while the tab is hidden so a backgrounded tab makes no requests.
    useEffect(() => {
        let cancelled = false;

        const fetchNotifications = async () => {
            if (document.hidden) return;
            try {
                const response = await api.get('/api/notifications/');
                if (cancelled) return;
                const data = unwrap<Notification>(response);
                setNotifications(data);
                setUnreadCount(data.filter((n) => !n.is_read).length);
            } catch {
                // Not authenticated / offline — leave state as-is
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, POLL_MS);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleBellClick = () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            setUnreadCount(0);
            api.post('/api/notifications/mark_all_read/').catch(() => {});
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleBellClick}
                aria-label="Notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-base-2"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error" />
                )}
            </button>

            {/* Flat white surface, not glass — this dropdown sits over the plain
                page background, not photography, so per the surgical-glass rule
                it stays solid. */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
                    >
                        <div className="border-b border-border p-4">
                            <h3 className="font-semibold text-foreground">Notifications</h3>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-sm text-muted">
                                    No new notifications
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={cn(
                                                "p-4 transition-colors hover:bg-base-2",
                                                !notification.is_read && "bg-primary/5"
                                            )}
                                        >
                                            <p className="text-sm text-foreground">{notification.message}</p>
                                            <p className="mt-1 text-xs text-muted">
                                                {new Date(notification.created_at).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
