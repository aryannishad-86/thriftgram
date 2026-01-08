'use client';

import { useEffect, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

interface Message {
    id: number;
    sender: {
        username: string;
        profile_picture?: string | null;
    };
    content: string;
    created_at: string;
    is_read?: boolean;
}

interface ChatWindowProps {
    messages: Message[];
    currentUsername: string;
    onSendMessage: (content: string) => void;
    loading?: boolean;
}

export default function ChatWindow({ messages, currentUsername, onSendMessage, loading = false }: ChatWindowProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex flex-col h-full">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-background">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-base-02">Loading messages...</div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageCircle className="w-16 h-16 text-base-01 mb-4" />
                        <h3 className="text-lg font-semibold text-base-03 mb-2">No messages yet</h3>
                        <p className="text-base-02">Start the conversation by sending a message!</p>
                    </div>
                ) : (
                    <>
                        {messages.map((message) => (
                            <MessageBubble
                                key={message.id}
                                message={message}
                                isOwnMessage={message.sender.username === currentUsername}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Message Input */}
            <MessageInput onSend={onSendMessage} disabled={loading} />
        </div>
    );
}
