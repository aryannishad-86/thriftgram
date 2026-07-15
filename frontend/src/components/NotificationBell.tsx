'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import api, { unwrap } from '@/lib/api';
import GradientIconButton from './GradientIconButton';

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

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
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
            <GradientIconButton
                icon={Bell}
                label="Notifications"
                gradient="from-violet-500 to-purple-500"
                onClick={handleBellClick}
                badgeCount={unreadCount}
            />

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-white/10 bg-black/90 backdrop-blur-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-white/10">
                        <h3 className="font-semibold text-white">Notifications</h3>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                No new notifications
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {notifications.map((notification) => (
                                    <div key={notification.id} className="p-4 hover:bg-white/5 transition-colors cursor-pointer">
                                        <p className="text-sm text-white">{notification.message}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(notification.created_at).toLocaleTimeString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
