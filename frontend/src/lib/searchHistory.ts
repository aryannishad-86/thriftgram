const SEARCH_HISTORY_KEY = 'thriftgram_search_history';
const MAX_HISTORY_ITEMS = 10;

export const searchHistory = {
    /**
     * Add a search query to history
     */
    addToHistory(query: string): void {
        if (!query.trim()) return;

        const history = this.getHistory();

        // Remove if already exists
        const filtered = history.filter(item => item.toLowerCase() !== query.toLowerCase());

        // Add to beginning
        const newHistory = [query, ...filtered].slice(0, MAX_HISTORY_ITEMS);

        if (typeof window !== 'undefined') {
            localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
        }
    },

    /**
     * Get search history
     */
    getHistory(): string[] {
        if (typeof window === 'undefined') return [];

        try {
            const history = localStorage.getItem(SEARCH_HISTORY_KEY);
            return history ? JSON.parse(history) : [];
        } catch {
            return [];
        }
    },

    /**
     * Clear all search history
     */
    clearHistory(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(SEARCH_HISTORY_KEY);
        }
    },

    /**
     * Remove a specific item from history
     */
    removeFromHistory(query: string): void {
        const history = this.getHistory();
        const filtered = history.filter(item => item !== query);

        if (typeof window !== 'undefined') {
            localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filtered));
        }
    }
};
