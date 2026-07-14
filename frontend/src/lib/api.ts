import axios from 'axios';
import type { AxiosResponse } from 'axios';

// The backend host, with any trailing /api stripped so every call path can carry
// its own /api/ prefix uniformly. Tolerates NEXT_PUBLIC_API_URL being set with or
// without the suffix — the two forms have silently broken each other before.
const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const baseURL = rawBaseUrl.replace(/\/+$/, '').replace(/\/api$/, '');

// DRF paginates list endpoints globally, so list responses are
// { count, next, previous, results }. Non-list responses are the bare object.
// unwrap() returns the array in either case.
export function unwrap<T = unknown>(res: AxiosResponse): T[] {
    const data = res.data;
    if (data && Array.isArray(data.results)) return data.results as T[];
    return (Array.isArray(data) ? data : []) as T[];
}

// Event emitter for cold start detection
export const coldStartEvents = {
    listeners: new Set<(show: boolean) => void>(),
    emit(show: boolean) {
        this.listeners.forEach(listener => listener(show));
    },
    subscribe(listener: (show: boolean) => void) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
};

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 90000, // 90 second timeout for cold starts
});

// Track request start time and show loader for slow requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Track request start time
    (config as any).metadata = { startTime: Date.now() };

    // Show cold start loader after 5 seconds
    const timerId = setTimeout(() => {
        coldStartEvents.emit(true);
    }, 5000);

    (config as any).metadata.timerId = timerId;

    return config;
});

api.interceptors.response.use(
    (response) => {
        // Clear timeout and hide loader
        const timerId = (response.config as any).metadata?.timerId;
        if (timerId) {
            clearTimeout(timerId);
        }
        coldStartEvents.emit(false);

        return response;
    },
    async (error) => {
        // Clear timeout and hide loader
        const timerId = (error.config as any)?.metadata?.timerId;
        if (timerId) {
            clearTimeout(timerId);
        }
        coldStartEvents.emit(false);

        if (error.response?.status === 401) {
            // Token expired or invalid
            if (typeof window !== 'undefined') {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('username');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

