import axios from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// axios's own config types have no field for either of these — request-timing
// metadata (used for the cold-start loader) and the retry-once guard used by
// the refresh-token flow below. error.config from an AxiosError is itself an
// InternalAxiosRequestConfig (headers always present), same as the request
// interceptor's config — one extended type covers both.
interface ExtendedConfigFields {
    metadata?: { startTime: number; timerId: ReturnType<typeof setTimeout> };
    _retry?: boolean;
}
type RequestConfig = InternalAxiosRequestConfig & ExtendedConfigFields;

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
api.interceptors.request.use((config: RequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Show cold start loader after 5 seconds
    const timerId = setTimeout(() => {
        coldStartEvents.emit(true);
    }, 5000);

    config.metadata = { startTime: Date.now(), timerId };

    return config;
});

function logoutLocally() {
    if (typeof window === 'undefined') return;

    // Only bounce someone to /login if they actually HAD a session that just
    // became invalid. Without this guard, any 401 from a background request
    // made on behalf of a never-logged-in visitor redirected them to /login —
    // which is exactly what happened on the public homepage: NotificationBell
    // polls /api/notifications/ every 30s regardless of auth, that 401s for
    // an anonymous visitor, and this handler bounced them off the public
    // marketplace ~30s after they arrived. Verified by reproducing it in a
    // browser against the real dev server, and confirmed pre-existing (the
    // same unconditional redirect is in commit 5fd6422, before any of this
    // hardening work). An anonymous visitor isn't "logged out" — they were
    // never logged in, and there's nothing for them to re-authenticate.
    const hadSession = !!localStorage.getItem('access_token') || !!localStorage.getItem('refresh_token');

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');

    if (hadSession) {
        window.location.href = '/login';
    }
}

// The backend's access token now expires in 30 minutes (was a silent 5 —
// SimpleJWT's un-configured default — before the API ever set an explicit
// lifetime). Nothing here previously called /api/token/refresh/ at all, so
// every session ended in a forced logout at whatever that lifetime was.
// Concurrent 401s share one in-flight refresh: the backend rotates the
// refresh token on every use and blacklists the one just spent, so firing
// several refresh calls at once would have the second one fail against an
// already-blacklisted token and force a logout that a single shared refresh
// would have avoided.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return null;

    // Plain axios, not the `api` instance — deliberately skips the
    // interceptors below so a failed refresh can't recurse back into this
    // same refresh logic.
    const res = await axios.post(`${baseURL}/api/token/refresh/`, { refresh: refreshToken });
    const { access, refresh } = res.data;
    localStorage.setItem('access_token', access);
    if (refresh) {
        localStorage.setItem('refresh_token', refresh); // ROTATE_REFRESH_TOKENS issues a new one each time
    }
    return access;
}

api.interceptors.response.use(
    (response) => {
        // Clear timeout and hide loader
        const timerId = (response.config as RequestConfig).metadata?.timerId;
        if (timerId) {
            clearTimeout(timerId);
        }
        coldStartEvents.emit(false);

        return response;
    },
    async (error) => {
        // Clear timeout and hide loader
        const timerId = (error.config as RequestConfig | undefined)?.metadata?.timerId;
        if (timerId) {
            clearTimeout(timerId);
        }
        coldStartEvents.emit(false);

        const originalRequest = error.config as RequestConfig | undefined;
        // /api/token/ covers both login and the refresh call itself — retrying
        // either with a "refreshed" token would be nonsensical (login isn't
        // authenticated in the first place; refreshing to retry the refresh
        // call would recurse).
        const isAuthEndpoint = originalRequest?.url?.includes('/api/token/');

        if (error.response?.status === 401 && originalRequest && !isAuthEndpoint && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                if (!refreshPromise) {
                    refreshPromise = refreshAccessToken().finally(() => { refreshPromise = null; });
                }
                const newAccess = await refreshPromise;
                if (newAccess) {
                    originalRequest.headers.Authorization = `Bearer ${newAccess}`;
                    return api(originalRequest);
                }
            } catch {
                // Refresh call itself failed (expired/blacklisted refresh
                // token) — fall through to a real logout below.
            }
            logoutLocally();
            return Promise.reject(error);
        }

        if (error.response?.status === 401) {
            logoutLocally();
        }
        return Promise.reject(error);
    }
);

export default api;

