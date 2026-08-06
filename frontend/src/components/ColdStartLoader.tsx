'use client';

import { useEffect, useState } from 'react';

interface ColdStartLoaderProps {
    show: boolean;
}

export default function ColdStartLoader({ show }: ColdStartLoaderProps) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!show) {
            setElapsed(0);
            return;
        }

        const interval = setInterval(() => {
            setElapsed((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [show]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            {/* Flat solid card, not glass — a utility status panel, no photography
                behind it. Off-palette purple/cyan swapped for the accent token. */}
            <div className="relative mx-4 max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl">
                <div className="mb-6 flex justify-center">
                    <div className="relative h-16 w-16">
                        <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary" />
                    </div>
                </div>

                <div className="space-y-4 text-center">
                    <h3 className="text-xl font-semibold text-foreground">
                        Waking up the server...
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        The backend is starting up from sleep mode.
                        <br />
                        This may take up to 60 seconds (free tier limitation).
                    </p>

                    <div className="pt-4">
                        <div className="mb-2 flex justify-between text-xs text-muted">
                            <span>Elapsed: {elapsed}s</span>
                            <span>Expected: ~30-60s</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-base-2">
                            <div
                                className="h-full bg-primary transition-all duration-1000 ease-out"
                                style={{ width: `${Math.min((elapsed / 60) * 100, 100)}%` }}
                            />
                        </div>
                    </div>

                    <p className="pt-2 text-xs text-muted">
                        💡 Tip: The server stays awake for 15 minutes after the first request
                    </p>
                </div>
            </div>
        </div>
    );
}
