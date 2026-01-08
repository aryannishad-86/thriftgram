'use client';

import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import Image from 'next/image';

interface MessageBubbleProps {
    message: {
        id: number;
        sender: {
            username: string;
            profile_picture?: string | null;
        };
        content: string;
        created_at: string;
        is_read?: boolean;
    };
    isOwnMessage: boolean;
}

export default function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 mb-4 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
        >
            {/* Avatar (only for received messages) */}
            {!isOwnMessage && (
                <div className="w-8 h-8 rounded-full overflow-hidden bg-base-2 flex-shrink-0">
                    {message.sender.profile_picture ? (
                        <Image
                            src={message.sender.profile_picture}
                            alt={message.sender.username}
                            width={32}
                            height={32}
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <User className="w-4 h-4 text-base-01" />
                        </div>
                    )}
                </div>
            )}

            {/* Message Content */}
            <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                <div
                    className={`px-4 py-2 rounded-2xl ${isOwnMessage
                            ? 'bg-primary text-white rounded-br-sm'
                            : 'bg-base-2 text-base-03 rounded-bl-sm'
                        }`}
                >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                </div>
                <span className="text-xs text-base-01 mt-1 px-2">
                    {formatTime(message.created_at)}
                    {isOwnMessage && message.is_read && ' • Read'}
                </span>
            </div>
        </motion.div>
    );
}
