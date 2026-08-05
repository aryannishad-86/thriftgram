'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import ConversationList from '@/components/ConversationList';
import ChatWindow from '@/components/ChatWindow';
import api, { unwrap } from '@/lib/api';

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

function MessagesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
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

    // Handle URL parameter for pre-selecting conversation
    useEffect(() => {
        const conversationId = searchParams.get('conversation');
        if (conversationId && conversations.length > 0) {
            const id = parseInt(conversationId);
            if (!isNaN(id)) {
                handleSelectConversation(id);
            }
        }
    }, [searchParams, conversations]);

    // Poll the open conversation and the conversation list every 5s. Skip while
    // the tab is hidden so a backgrounded tab makes no requests.
    useEffect(() => {
        if (!activeConversation) return;

        const interval = setInterval(() => {
            if (document.hidden) return;
            fetchMessages(activeConversation, false);
            fetchConversations();
        }, 5000);

        return () => clearInterval(interval);
    }, [activeConversation]);

    const fetchConversations = async () => {
        try {
            const response = await api.get('/api/conversations/');
            setConversations(unwrap<Conversation>(response));
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
            setMessages(unwrap<Message>(response));
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
                    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-md">
                        <div className="p-4 border-b border-border bg-base-2">
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
                    <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col shadow-md">
                        {activeConversation ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b-2 border-border flex items-center gap-3 bg-base-2">
                                    <div className="w-10 h-10 rounded-full bg-base-03/10 flex items-center justify-center">
                                        <MessageCircle className="w-5 h-5 text-base-03" />
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
                                <MessageCircle className="w-16 h-16 text-base-02 mb-4" />
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

export default function MessagesPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-background pt-20">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-base-02">Loading messages...</div>
                </div>
            </main>
        }>
            <MessagesContent />
        </Suspense>
    );
}
