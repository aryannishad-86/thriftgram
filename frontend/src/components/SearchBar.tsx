'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchBar() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const openSearch = () => {
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const closeSearch = () => {
        setIsOpen(false);
        setQuery('');
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeSearch();
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                openSearch();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const suggestions = [
        { text: 'Vintage Tees', type: 'trending' },
        { text: 'Nike Windbreaker', type: 'history' },
        { text: 'Denim Jackets', type: 'trending' },
        { text: 'Carhartt', type: 'history' },
    ];

    return (
        <>
            {/* Search Trigger Button */}
            <button
                onClick={openSearch}
                className="p-2 text-muted-foreground hover:text-primary transition-colors hover:bg-white/5 rounded-full"
                aria-label="Open search"
            >
                <Search className="h-6 w-6" />
            </button>

            {/* Full Screen Search Dialog */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4"
                    >
                        {/* Backdrop with Motion Blur */}
                        <motion.div
                            initial={{ backdropFilter: 'blur(0px)' }}
                            animate={{ backdropFilter: 'blur(16px)' }}
                            exit={{ backdropFilter: 'blur(0px)' }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 bg-black/60"
                            onClick={closeSearch}
                        />

                        {/* Search Container */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="relative w-full max-w-2xl bg-black/80 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
                        >
                            {/* Search Input Header */}
                            <div className="flex items-center gap-4 p-4 border-b border-white/10">
                                <Search className="h-5 w-5 text-muted-foreground" />
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    type="text"
                                    placeholder="Search ThriftGram..."
                                    className="flex-1 bg-transparent text-lg text-white placeholder:text-muted-foreground/50 outline-none"
                                />
                                <button
                                    onClick={closeSearch}
                                    className="p-1 text-muted-foreground hover:text-white transition-colors rounded-full hover:bg-white/10"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Suggestions / Results */}
                            <div className="p-2">
                                <div className="text-xs font-medium text-muted-foreground px-4 py-2 uppercase tracking-wider">
                                    Suggested
                                </div>
                                <div className="grid gap-1">
                                    {suggestions.map((item, index) => (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                setQuery(item.text);
                                                window.location.href = `/?search=${encodeURIComponent(item.text)}`;
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-gray-300 hover:bg-white/10 hover:text-white transition-colors group"
                                        >
                                            {item.type === 'history' ? (
                                                <Clock className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                            ) : (
                                                <TrendingUp className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                                            )}
                                            <span>{item.text}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-4 py-3 bg-white/5 border-t border-white/5 text-xs text-muted-foreground flex justify-between">
                                <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">ESC</kbd> to close</span>
                                <span>Search by <span className="text-primary">ThriftGram</span></span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

