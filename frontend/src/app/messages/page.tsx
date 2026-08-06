'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import ConversationList from '@/components/ConversationList';
import ChatWindow from '@/components/ChatWindow';
import { EmptyState } from '@/components/ui/empty-state';
import { PageShell } from '@/components/layout/page-shell';
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
        <PageShell>
            <h1 className="font-display mb-8 text-3xl font-semibold text-foreground">Messages</h1>

            <div className="grid h-[calc(100vh-260px)] gap-6 md:grid-cols-[350px_1fr]">
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-md">
                    <div className="border-b border-border bg-base-2 p-4">
                        <h2 className="font-semibold text-foreground">Conversations</h2>
                    </div>
                    <ConversationList
                        conversations={conversations}
                        currentUsername={currentUsername}
                        activeConversationId={activeConversation}
                        onSelectConversation={handleSelectConversation}
                        loading={loading}
                    />
                </div>

                <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-md">
                    {activeConversation ? (
                        <>
                            <div className="flex items-center gap-3 border-b border-border bg-base-2 p-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/10">
                                    <MessageCircle className="h-5 w-5 text-foreground" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-foreground">
                                        @{otherParticipant?.username || 'Unknown'}
                                    </h2>
                                    {activeConversationData?.item && (
                                        <p className="text-xs text-muted-foreground">
                                            Re: {activeConversationData.item.title}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <ChatWindow
                                messages={messages}
                                currentUsername={currentUsername}
                                onSendMessage={handleSendMessage}
                                loading={messagesLoading}
                            />
                        </>
                    ) : (
                        <EmptyState
                            icon={MessageCircle}
                            title="Select a conversation"
                            description="Choose a conversation from the list to start chatting"
                            className="h-full"
                        />
                    )}
                </div>
            </div>
        </PageShell>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={
            <PageShell>
                <div className="text-muted-foreground">Loading messages...</div>
            </PageShell>
        }>
            <MessagesContent />
        </Suspense>
    );
}
