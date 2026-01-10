'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, X, TrendingUp } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { searchHistory } from '@/lib/searchHistory';
import api from '@/lib/api';

interface SearchResult {
    id: number;
    title: string;
    price: string;
    images: Array<{ image: string }>;
}

export default function SearchAutocomplete() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
    const [history, setHistory] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const debouncedQuery = useDebounce(query, 300);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Load search history on mount
    useEffect(() => {
        setHistory(searchHistory.getHistory());
    }, []);

    // Fetch suggestions when debounced query changes
    useEffect(() => {
        if (debouncedQuery.trim().length >= 2) {
            fetchSuggestions(debouncedQuery);
        } else {
            setSuggestions([]);
        }
    }, [debouncedQuery]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchSuggestions = async (searchQuery: string) => {
        setLoading(true);
        try {
            const response = await api.get(`/api/items/?search=${searchQuery}&limit=5`);
            setSuggestions(response.data.results || response.data);
        } catch (error) {
            console.error('Failed to fetch suggestions', error);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (searchQuery: string) => {
        if (!searchQuery.trim()) return;

        searchHistory.addToHistory(searchQuery);
        setHistory(searchHistory.getHistory());
        setIsOpen(false);
        setQuery('');
        router.push(`/?search=${encodeURIComponent(searchQuery)}`);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(query);
    };

    const handleSuggestionClick = (item: SearchResult) => {
        searchHistory.addToHistory(item.title);
        setHistory(searchHistory.getHistory());
        setIsOpen(false);
        setQuery('');
        router.push(`/items/${item.id}`);
    };

    const handleHistoryClick = (historyQuery: string) => {
        setQuery(historyQuery);
        handleSearch(historyQuery);
    };

    const handleRemoveHistory = (historyQuery: string, e: React.MouseEvent) => {
        e.stopPropagation();
        searchHistory.removeFromHistory(historyQuery);
        setHistory(searchHistory.getHistory());
    };

    const handleClearHistory = () => {
        searchHistory.clearHistory();
        setHistory([]);
    };

    const showDropdown = isOpen && (query.length >= 2 || history.length > 0);

    return (
        <div ref={wrapperRef} className="relative w-full max-w-2xl">
            {/* Search Input */}
            <form onSubmit={handleSubmit} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-base-01" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Search ThriftGram..."
                    className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-border bg-background text-base-03 focus:outline-none focus:border-primary transition-all"
                />
                {query && (
                    <button
                        type="button"
                        onClick={() => {
                            setQuery('');
                            setSuggestions([]);
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-base-01 hover:text-base-03 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </form>

            {/* Dropdown */}
            <AnimatePresence>
                {showDropdown && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full mt-2 w-full bg-card border border-border rounded-2xl shadow-lg overflow-hidden z-50"
                    >
                        {/* Recent Searches */}
                        {query.length < 2 && history.length > 0 && (
                            <div className="p-4 border-b border-border">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-base-03 flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Recent Searches
                                    </h3>
                                    <button
                                        onClick={handleClearHistory}
                                        className="text-xs text-base-02 hover:text-error transition-colors"
                                    >
                                        Clear All
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    {history.map((item, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleHistoryClick(item)}
                                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-base-2 transition-colors text-left group"
                                        >
                                            <span className="text-sm text-base-03">{item}</span>
                                            <button
                                                onClick={(e) => handleRemoveHistory(item, e)}
                                                className="opacity-0 group-hover:opacity-100 text-base-01 hover:text-error transition-all"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Suggestions */}
                        {query.length >= 2 && (
                            <div className="p-4">
                                {loading ? (
                                    <div className="text-center py-4 text-base-02">
                                        Searching...
                                    </div>
                                ) : suggestions.length > 0 ? (
                                    <>
                                        <h3 className="text-sm font-semibold text-base-03 mb-3 flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4" />
                                            Suggestions
                                        </h3>
                                        <div className="space-y-2">
                                            {suggestions.map((item) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => handleSuggestionClick(item)}
                                                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-base-2 transition-colors"
                                                >
                                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-base-2 flex-shrink-0">
                                                        {item.images && item.images.length > 0 ? (
                                                            <img
                                                                src={item.images[0].image}
                                                                alt={item.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Search className="w-5 h-5 text-base-01" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <div className="text-sm font-medium text-base-03 line-clamp-1">
                                                            {item.title}
                                                        </div>
                                                        <div className="text-sm text-base-03 font-semibold">
                                                            ₹{parseFloat(item.price).toFixed(2)}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-4 text-base-02">
                                        No results found for "{query}"
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
