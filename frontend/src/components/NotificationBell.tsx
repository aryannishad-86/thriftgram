'use client';

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import { Bell } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import api, { unwrap } from '@/lib/api';
import { usePolling } from '@/hooks/usePolling';
import { cn } from '@/lib/utils';

interface Notification {
    id: number;
    message: string;
    type: 'like' | 'message' | 'follow';
    is_read: boolean;
    created_at: string;
}

const POLL_MS = 30000;

/** localStorage only fires 'storage' in OTHER tabs, so this picks up a
 *  sign-in/sign-out made elsewhere. Sign-in in THIS tab does a full page
 *  navigation (see login/page.tsx), which remounts everything anyway. */
function subscribeToAuthChanges(onChange: () => void) {
    window.addEventListener('storage', onChange);
    return () => window.removeEventListener('storage', onChange);
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Poll every 30s (WebSockets aren't available on the WSGI backend).
    // usePolling handles the hidden-tab pause, unmount cleanup, and — the
    // part this didn't have before — exponential backoff while requests keep
    // failing, so an unauthenticated visitor or a backend outage doesn't mean
    // every open tab polls a failing endpoint every 30s forever.
    //
    // Deliberately does NOT swallow the error (the old inline version caught
    // and ignored it): usePolling needs the rejection to know the request
    // failed. State is simply left as-is on failure, same user-visible
    // behavior as before.
    const fetchNotifications = useCallback(async () => {
        const response = await api.get('/api/notifications/');
        const data = unwrap<Notification>(response);
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.is_read).length);
    }, []);

    // Only poll for a signed-in visitor. An anonymous visitor has no
    // notifications, so this was a guaranteed-401 request every 30s — which,
    // besides being pointless load, is what used to bounce anonymous visitors
    // off the public homepage to /login (see logoutLocally in lib/api.ts).
    // Both halves are fixed; this one keeps the request from being made at all.
    //
    // useSyncExternalStore rather than a setState-in-effect: localStorage
    // doesn't exist during SSR, so the value has to come from a
    // client-only snapshot with an explicit server snapshot (false) — this
    // is exactly the hook's purpose, and it avoids the extra render pass a
    // setState-in-effect costs.
    const isSignedIn = useSyncExternalStore(
        subscribeToAuthChanges,
        () => !!localStorage.getItem('access_token'),
        () => false // server snapshot: never signed in during SSR
    );

    usePolling(fetchNotifications, { intervalMs: POLL_MS, enabled: isSignedIn });

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
