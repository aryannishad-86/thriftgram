'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react';

export interface FilterState {
    minPrice: number | null;
    maxPrice: number | null;
    sizes: string[];
    condition: string | null;
    ordering: string;
}

interface AdvancedFiltersProps {
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];
const SORT_OPTIONS = [
    { value: '-created_at', label: 'Newest First' },
    { value: 'created_at', label: 'Oldest First' },
    { value: 'price', label: 'Price: Low to High' },
    { value: '-price', label: 'Price: High to Low' },
];

export default function AdvancedFilters({ filters, onFiltersChange }: AdvancedFiltersProps) {
    const [isOpen, setIsOpen] = useState(false);

    const activeFilterCount = [
        filters.minPrice !== null,
        filters.maxPrice !== null,
        filters.sizes.length > 0,
        filters.condition !== null,
        filters.ordering !== '-created_at',
    ].filter(Boolean).length;

    const handleClearAll = () => {
        onFiltersChange({
            minPrice: null,
            maxPrice: null,
            sizes: [],
            condition: null,
            ordering: '-created_at',
        });
    };

    const toggleSize = (size: string) => {
        const newSizes = filters.sizes.includes(size)
            ? filters.sizes.filter(s => s !== size)
            : [...filters.sizes, size];
        onFiltersChange({ ...filters, sizes: newSizes });
    };

    return (
        <div className="w-full">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-6 py-3 bg-card border border-border rounded-2xl hover:bg-base-2 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-base-03" />
                    <span className="font-semibold text-base-03">Filters</span>
                    {activeFilterCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-primary text-white text-xs font-semibold">
                            {activeFilterCount}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {activeFilterCount > 0 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClearAll();
                            }}
                            className="text-sm text-base-02 hover:text-error transition-colors"
                        >
                            Clear All
                        </button>
                    )}
                    <ChevronDown
                        className={`w-5 h-5 text-base-02 transition-transform ${isOpen ? 'rotate-180' : ''
                            }`}
                    />
                </div>
            </button>

            {/* Filters Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-4 p-6 bg-card border border-border rounded-2xl space-y-6">
                            {/* Price Range */}
                            <div>
                                <h3 className="text-sm font-semibold text-base-03 mb-3">Price Range</h3>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-xs text-base-02 mb-1 block">Min ($)</label>
                                        <input
                                            type="number"
                                            value={filters.minPrice || ''}
                                            onChange={(e) =>
                                                onFiltersChange({
                                                    ...filters,
                                                    minPrice: e.target.value ? Number(e.target.value) : null,
                                                })
                                            }
                                            placeholder="0"
                                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-base-03 focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs text-base-02 mb-1 block">Max ($)</label>
                                        <input
                                            type="number"
                                            value={filters.maxPrice || ''}
                                            onChange={(e) =>
                                                onFiltersChange({
                                                    ...filters,
                                                    maxPrice: e.target.value ? Number(e.target.value) : null,
                                                })
                                            }
                                            placeholder="Any"
                                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-base-03 focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Size */}
                            <div>
                                <h3 className="text-sm font-semibold text-base-03 mb-3">Size</h3>
                                <div className="flex flex-wrap gap-2">
                                    {SIZES.map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => toggleSize(size)}
                                            className={`px-4 py-2 rounded-lg border transition-all ${filters.sizes.includes(size)
                                                    ? 'bg-primary text-white border-primary'
                                                    : 'bg-background text-base-03 border-border hover:border-primary'
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Condition */}
                            <div>
                                <h3 className="text-sm font-semibold text-base-03 mb-3">Condition</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {CONDITIONS.map((cond) => (
                                        <button
                                            key={cond}
                                            onClick={() =>
                                                onFiltersChange({
                                                    ...filters,
                                                    condition: filters.condition === cond ? null : cond,
                                                })
                                            }
                                            className={`px-4 py-2 rounded-lg border transition-all ${filters.condition === cond
                                                    ? 'bg-primary text-white border-primary'
                                                    : 'bg-background text-base-03 border-border hover:border-primary'
                                                }`}
                                        >
                                            {cond}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sort By */}
                            <div>
                                <h3 className="text-sm font-semibold text-base-03 mb-3">Sort By</h3>
                                <select
                                    value={filters.ordering}
                                    onChange={(e) =>
                                        onFiltersChange({ ...filters, ordering: e.target.value })
                                    }
                                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-base-03 focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    {SORT_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Active Filter Badges */}
            {activeFilterCount > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {filters.minPrice !== null && (
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm flex items-center gap-2">
                            Min: ${filters.minPrice}
                            <button
                                onClick={() => onFiltersChange({ ...filters, minPrice: null })}
                                className="hover:text-error transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {filters.maxPrice !== null && (
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm flex items-center gap-2">
                            Max: ${filters.maxPrice}
                            <button
                                onClick={() => onFiltersChange({ ...filters, maxPrice: null })}
                                className="hover:text-error transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {filters.sizes.map((size) => (
                        <span
                            key={size}
                            className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm flex items-center gap-2"
                        >
                            Size: {size}
                            <button
                                onClick={() => toggleSize(size)}
                                className="hover:text-error transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                    {filters.condition && (
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm flex items-center gap-2">
                            {filters.condition}
                            <button
                                onClick={() => onFiltersChange({ ...filters, condition: null })}
                                className="hover:text-error transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
