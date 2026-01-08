'use client';

import { User, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface Conversation {
    id: number;
    participants: Array<{
        username: string;
        profile_picture?: string | null;
    }>;
    item?: {
        id: number;
        title: string;
    } | null;
    last_message?: {
        content: string;
        created_at: string;
    } | null;
    unread_count?: number;
    updated_at: string;
}

interface ConversationListProps {
    conversations: Conversation[];
    currentUsername: string;
    activeConversationId: number | null;
    onSelectConversation: (conversationId: number) => void;
    loading?: boolean;
}

export default function ConversationList({
    conversations,
    currentUsername,
    activeConversationId,
    onSelectConversation,
    loading = false
}: ConversationListProps) {
    const getOtherParticipant = (participants: Conversation['participants']) => {
        return participants.find(p => p.username !== currentUsername);
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else if (diffInHours < 168) {
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-base-02">Loading conversations...</div>
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MessageCircle className="w-16 h-16 text-base-01 mb-4" />
                <h3 className="text-lg font-semibold text-base-03 mb-2">No conversations yet</h3>
                <p className="text-base-02">Start chatting with sellers or buyers!</p>
            </div>
        );
    }

    return (
        <div className="overflow-y-auto h-full">
            {conversations.map((conversation) => {
                const otherUser = getOtherParticipant(conversation.participants);
                const isActive = conversation.id === activeConversationId;

                return (
                    <motion.button
                        key={conversation.id}
                        onClick={() => onSelectConversation(conversation.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full p-4 flex gap-3 items-start border-b border-border hover:bg-base-2 transition-colors text-left ${isActive ? 'bg-base-2 border-l-4 border-primary' : ''
                            }`}
                    >
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-base-2 flex-shrink-0">
                            {otherUser?.profile_picture ? (
                                <Image
                                    src={otherUser.profile_picture}
                                    alt={otherUser.username}
                                    width={48}
                                    height={48}
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <User className="w-6 h-6 text-base-01" />
                                </div>
                            )}
                        </div>

                        {/* Conversation Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-base-03 truncate">
                                    @{otherUser?.username || 'Unknown'}
                                </h3>
                                {conversation.last_message && (
                                    <span className="text-xs text-base-01 flex-shrink-0 ml-2">
                                        {formatTime(conversation.last_message.created_at)}
                                    </span>
                                )}
                            </div>

                            {/* Item context */}
                            {conversation.item && (
                                <p className="text-xs text-base-02 mb-1 truncate">
                                    Re: {conversation.item.title}
                                </p>
                            )}

                            {/* Last message */}
                            {conversation.last_message && (
                                <p className="text-sm text-base-02 truncate">
                                    {conversation.last_message.content}
                                </p>
                            )}

                            {/* Unread badge */}
                            {conversation.unread_count && conversation.unread_count > 0 && (
                                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-error text-white text-xs font-semibold">
                                    {conversation.unread_count}
                                </span>
                            )}
                        </div>
                    </motion.button>
                );
            })}
        </div>
    );
}
