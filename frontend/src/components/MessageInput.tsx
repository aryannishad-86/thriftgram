'use client';

import { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
    onSend: (content: string) => void;
    disabled?: boolean;
}

export default function MessageInput({ onSend, disabled = false }: MessageInputProps) {
    const [message, setMessage] = useState('');

    const handleSend = () => {
        if (message.trim() && !disabled) {
            onSend(message.trim());
            setMessage('');
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="border-t-2 border-border p-4" style={{ backgroundColor: '#F7F1E3' }}>
            <div className="flex gap-3 items-end">
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    disabled={disabled}
                    rows={1}
                    className="flex-1 px-4 py-3 rounded-2xl border-2 border-border bg-white text-base-03 resize-none focus:outline-none focus:ring-2 focus:ring-base-03/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                        minHeight: '48px',
                        maxHeight: '120px',
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={!message.trim() || disabled}
                    className="p-3 rounded-full bg-base-03 text-white hover:bg-base-03/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
            <p className="text-xs text-base-01 mt-2 px-2">
                Press Enter to send, Shift+Enter for new line
            </p>
        </div>
    );
}
