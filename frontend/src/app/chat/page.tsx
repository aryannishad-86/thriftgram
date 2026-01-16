'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
    message: string;
    sender: string;
}

import { Suspense } from 'react';

function ChatContent() {
    const searchParams = useSearchParams();
    const roomName = searchParams.get('room') || 'general';
    const username = 'vintage_queen'; // TODO: Get from auth context

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const socketRef = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [wsError, setWsError] = useState<string | null>(null);

    useEffect(() => {
        // Connect to WebSocket only if WS_URL is explicitly set
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
        if (!wsUrl) {
            setWsError('Real-time messaging is not available in this environment.');
            return;
        }

        try {
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const socket = new WebSocket(`${wsProtocol}//${wsUrl}/ws/chat/${roomName}/`);
            socketRef.current = socket;

            socket.onopen = () => {
                console.log('WebSocket connected');
                setWsError(null);
            };

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                setMessages((prev) => [...prev, data]);
            };

            socket.onclose = () => {
                console.log('WebSocket disconnected');
            };

            socket.onerror = () => {
                setWsError('Connection lost. Messages may not update in real-time.');
            };

            return () => {
                socket.close();
            };
        } catch (error) {
            setWsError('Could not connect to chat server.');
        }
    }, [roomName]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputMessage.trim() && socketRef.current) {
            socketRef.current.send(JSON.stringify({
                message: inputMessage,
                sender: username
            }));
            setInputMessage('');
        }
    };

    return (
        <div className="container mx-auto max-w-3xl px-4 py-8 flex-1 flex flex-col h-screen">
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-white">Chat Room: {roomName}</h1>
            </div>

            {/* Chat Window */}
            <div className="flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl shadow-2xl mb-4 space-y-4">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex ${msg.sender === username ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.sender === username
                                ? 'bg-primary text-white rounded-tr-none'
                                : 'bg-white/10 text-white rounded-tl-none'
                                }`}
                        >
                            <p className="font-bold text-xs opacity-50 mb-1">{msg.sender}</p>
                            <p>{msg.message}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="flex gap-2">
                <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="bg-white/5 border-white/10 focus:border-primary/50 text-white"
                />
                <Button type="submit" size="icon" className="bg-base-03 hover:bg-base-03/90">
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    );
}

export default function ChatPage() {
    return (
        <main className="min-h-screen bg-background selection:bg-primary/30 relative overflow-hidden flex flex-col">
            {/* Cosmic Background */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,rgba(109,40,217,0.15),transparent)]" />

            <Suspense fallback={<div className="flex items-center justify-center h-screen text-white">Loading chat...</div>}>
                <ChatContent />
            </Suspense>
        </main>
    );
}
