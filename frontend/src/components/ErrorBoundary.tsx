'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error('Error caught by boundary:', error, errorInfo);
        // TODO: Send to error reporting service (e.g., Sentry)
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="min-h-screen bg-background flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-error" />
                        </div>
                        <h2 className="text-2xl font-bold text-base-03 mb-2">
                            Oops! Something went wrong
                        </h2>
                        <p className="text-base-02 mb-6">
                            We're sorry for the inconvenience. Please try refreshing the page.
                        </p>
                        {this.state.error && (
                            <details className="mb-6 text-left">
                                <summary className="text-sm text-base-01 cursor-pointer hover:text-base-03">
                                    Error details
                                </summary>
                                <pre className="mt-2 p-3 bg-base-2 rounded-lg text-xs text-base-02 overflow-auto">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors font-semibold"
                            >
                                Refresh Page
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="px-6 py-3 rounded-full border border-border text-base-03 hover:bg-base-2 transition-colors font-semibold"
                            >
                                Go Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
