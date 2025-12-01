'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import GradientIconButton from './GradientIconButton';

interface Notification {
    id: number;
    message: string;
    type: 'like' | 'message' | 'follow';
    created_at: string;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const socketRef = useRef<WebSocket | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fetch initial notifications
        const fetchNotifications = async () => {
            try {
                const response = await api.get('/notifications/');
                setNotifications(response.data);
                const unread = response.data.filter((n: any) => !n.is_read).length;
                setUnreadCount(unread);
            } catch (error) {
                console.error('Failed to fetch notifications', error);
            }
        };
        fetchNotifications();

        // Connect to WebSocket
        const socket = new WebSocket('ws://localhost:8000/ws/notifications/');
        socketRef.current = socket;

        socket.onopen = () => {
            console.log('Notification WebSocket connected');
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setNotifications((prev) => [data, ...prev]);
            setUnreadCount((prev) => prev + 1);
        };

        socket.onclose = () => {
            console.log('Notification WebSocket disconnected');
        };

        return () => {
            socket.close();
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
        if (!isOpen) {
            setUnreadCount(0); // Mark as read locally for now
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
