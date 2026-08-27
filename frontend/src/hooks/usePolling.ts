import { useEffect, useRef } from 'react';

interface PollingOptions {
    /** Base interval between successful polls, in ms. */
    intervalMs: number;
    /** Skip polling entirely (e.g. nothing selected yet). Defaults to true. */
    enabled?: boolean;
    /** Cap on the backed-off interval, in ms. Defaults to 5 minutes. */
    maxIntervalMs?: number;
}

/**
 * Interval polling that pauses on a hidden tab and backs off exponentially
 * while the callback keeps failing.
 *
 * The backoff is the reason this hook exists. Both polling loops in the app
 * (notifications at 30s, messages at 5s) already paused on document.hidden
 * and cleaned up on unmount, but neither slowed down when requests failed —
 * so a backend outage meant every open tab kept hammering a dead server at
 * full rate, from every client, indefinitely. That's the exact shape of load
 * that turns a brief backend problem into a longer one, and this project has
 * already had one real outage where the backend was returning 500s to
 * everything.
 *
 * On each consecutive failure the wait doubles (1x, 2x, 4x... up to
 * maxIntervalMs); the first success resets it to the base interval.
 *
 * Uses a self-scheduling setTimeout rather than setInterval because the delay
 * has to change between runs — setInterval's period is fixed at creation.
 * This also means the next poll is scheduled only after the previous one
 * settles, so a slow response can't stack up overlapping in-flight requests
 * the way a fixed interval can.
 */
export function usePolling(
    callback: () => Promise<void>,
    { intervalMs, enabled = true, maxIntervalMs = 5 * 60 * 1000 }: PollingOptions
) {
    // Kept in a ref so a caller passing an inline arrow function (which every
    // caller does) doesn't tear down and restart the polling loop on every
    // single render.
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        if (!enabled) return;

        let cancelled = false;
        let timeoutId: ReturnType<typeof setTimeout>;
        let consecutiveFailures = 0;

        const currentDelay = () =>
            Math.min(intervalMs * Math.pow(2, consecutiveFailures), maxIntervalMs);

        const scheduleNext = () => {
            if (cancelled) return;
            timeoutId = setTimeout(run, currentDelay());
        };

        const run = async () => {
            if (cancelled) return;

            // Don't poll a backgrounded tab — but do keep the loop alive so it
            // resumes on its own when the tab comes back, and don't count a
            // skipped run as a failure.
            if (document.hidden) {
                scheduleNext();
                return;
            }

            try {
                await callbackRef.current();
                consecutiveFailures = 0;
            } catch {
                consecutiveFailures += 1;
            }
            scheduleNext();
        };

        // Poll immediately on mount/enable rather than waiting a full interval
        // for the first result.
        run();

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
        };
    }, [intervalMs, enabled, maxIntervalMs]);
}
