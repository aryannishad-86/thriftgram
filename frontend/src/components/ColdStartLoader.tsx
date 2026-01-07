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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="relative max-w-md mx-4 p-8 rounded-2xl bg-gradient-to-br from-purple-500/10 to-cyan-500/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                {/* Animated spinner */}
                <div className="flex justify-center mb-6">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
                    </div>
                </div>

                {/* Message */}
                <div className="text-center space-y-4">
                    <h3 className="text-xl font-semibold text-white">
                        Waking up the server...
                    </h3>
                    <p className="text-gray-300 text-sm">
                        The backend is starting up from sleep mode.
                        <br />
                        This may take up to 60 seconds (free tier limitation).
                    </p>

                    {/* Progress indicator */}
                    <div className="pt-4">
                        <div className="flex justify-between text-xs text-gray-400 mb-2">
                            <span>Elapsed: {elapsed}s</span>
                            <span>Expected: ~30-60s</span>
                        </div>
                        <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-1000 ease-out"
                                style={{ width: `${Math.min((elapsed / 60) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Helpful tip */}
                    <p className="text-xs text-gray-400 pt-2">
                        💡 Tip: The server stays awake for 15 minutes after the first request
                    </p>
                </div>
            </div>
        </div>
    );
}
