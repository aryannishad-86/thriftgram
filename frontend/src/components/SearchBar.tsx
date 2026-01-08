'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchAutocomplete from './SearchAutocomplete';

export default function SearchBar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Search Icon Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 rounded-full hover:bg-base-2 transition-colors"
                aria-label="Search"
            >
                <Search className="w-5 h-5 text-base-03" />
            </button>

            {/* Search Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        />

                        {/* Search Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed top-24 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50"
                        >
                            <div className="bg-card rounded-3xl p-6 shadow-2xl border border-border">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-base-03">Search ThriftGram</h3>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 rounded-full hover:bg-base-2 transition-colors"
                                    >
                                        <X className="w-5 h-5 text-base-02" />
                                    </button>
                                </div>
                                <SearchAutocomplete />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
