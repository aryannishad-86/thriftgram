'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import ConversationList from '@/components/ConversationList';
import ChatWindow from '@/components/ChatWindow';
import api from '@/lib/api';

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

export default function MessagesPage() {
    const router = useRouter();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [currentUsername, setCurrentUsername] = useState<string>('');

    // Check authentication
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const username = localStorage.getItem('username');

        if (!token) {
            router.push('/login');
            return;
        }

        if (username) {
            setCurrentUsername(username);
        }
    }, [router]);

    // Fetch conversations
    useEffect(() => {
        fetchConversations();
    }, []);

    // Poll for new messages when a conversation is active
    useEffect(() => {
        if (!activeConversation) return;

        const interval = setInterval(() => {
            fetchMessages(activeConversation, false);
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, [activeConversation]);

    const fetchConversations = async () => {
        try {
            const response = await api.get('/api/conversations/');
            setConversations(response.data);
        } catch (error) {
            console.error('Failed to fetch conversations', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (conversationId: number, showLoading = true) => {
        if (showLoading) {
            setMessagesLoading(true);
        }

        try {
            const response = await api.get(`/api/conversations/${conversationId}/messages/`);
            setMessages(response.data);
        } catch (error) {
            console.error('Failed to fetch messages', error);
        } finally {
            if (showLoading) {
                setMessagesLoading(false);
            }
        }
    };

    const handleSelectConversation = (conversationId: number) => {
        setActiveConversation(conversationId);
        fetchMessages(conversationId);
    };

    const handleSendMessage = async (content: string) => {
        if (!activeConversation) return;

        try {
            const response = await api.post('/api/messages/', {
                conversation: activeConversation,
                content: content,
            });

            // Add new message to the list
            setMessages([...messages, response.data]);

            // Refresh conversations to update last message
            fetchConversations();
        } catch (error) {
            console.error('Failed to send message', error);
        }
    };

    const activeConversationData = conversations.find(c => c.id === activeConversation);
    const otherParticipant = activeConversationData?.participants.find(
        p => p.username !== currentUsername
    );

    return (
        <main className="min-h-screen bg-background pt-20">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-base-03 mb-8">Messages</h1>

                <div className="grid md:grid-cols-[350px_1fr] gap-6 h-[calc(100vh-200px)]">
                    {/* Conversation List */}
                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-border">
                            <h2 className="font-semibold text-base-03">Conversations</h2>
                        </div>
                        <ConversationList
                            conversations={conversations}
                            currentUsername={currentUsername}
                            activeConversationId={activeConversation}
                            onSelectConversation={handleSelectConversation}
                            loading={loading}
                        />
                    </div>

                    {/* Chat Window */}
                    <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
                        {activeConversation ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-border flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-base-2 flex items-center justify-center">
                                        <MessageCircle className="w-5 h-5 text-base-01" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-base-03">
                                            @{otherParticipant?.username || 'Unknown'}
                                        </h2>
                                        {activeConversationData?.item && (
                                            <p className="text-xs text-base-02">
                                                Re: {activeConversationData.item.title}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Messages */}
                                <ChatWindow
                                    messages={messages}
                                    currentUsername={currentUsername}
                                    onSendMessage={handleSendMessage}
                                    loading={messagesLoading}
                                />
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                                <MessageCircle className="w-16 h-16 text-base-01 mb-4" />
                                <h3 className="text-lg font-semibold text-base-03 mb-2">
                                    Select a conversation
                                </h3>
                                <p className="text-base-02">
                                    Choose a conversation from the list to start chatting
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
