'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import api, { coldStartEvents } from '@/lib/api';
import ColdStartLoader from '@/components/ColdStartLoader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGoogleLogin } from '@react-oauth/google';

export default function RegisterPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showColdStartLoader, setShowColdStartLoader] = useState(false);

    // Subscribe to cold start events
    useEffect(() => {
        const unsubscribe = coldStartEvents.subscribe(setShowColdStartLoader);
        return () => {
            unsubscribe();
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!username || !email || !password || !confirmPassword) {
            setError('Please fill in all fields');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const response = await api.post('/api/register/', {
                username,
                email,
                password,
            });

            // Auto-login: Store tokens
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            localStorage.setItem('username', username);

            // Redirect to home page
            window.location.href = '/';
        } catch (error: any) {
            console.error('Registration failed:', error);
            if (error.response && error.response.data) {
                setError(error.response.data.error || 'Registration failed. Please try again.');
            } else {
                setError('Registration failed. Please check your connection.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const res = await api.post('/api/auth/google/', {
                    access_token: tokenResponse.access_token,
                });
                localStorage.setItem('access_token', res.data.access);
                localStorage.setItem('refresh_token', res.data.refresh);
                if (res.data.user) {
                    localStorage.setItem('username', res.data.user.username);
                }
                window.location.href = '/';
            } catch (err) {
                console.error('Google login failed', err);
                setError('Google login failed');
            }
        },
        onError: () => {
            setError('Google login failed');
        }
    });

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-base-3 p-4 relative overflow-hidden selection:bg-primary/20">
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 -z-30 bg-base-3" />
            <div className="absolute inset-0 -z-20 bg-[url('/grid.svg')] bg-center opacity-[0.03]" />

            {/* Remove dark overlays */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 20 }}
                className="w-full max-w-md space-y-8 rounded-3xl border border-border bg-card p-8 shadow-lg relative"
            >
                {/* Subtle top accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-primary rounded-t-3xl" />

                <div className="text-center space-y-2">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="text-4xl font-bold tracking-tight text-base-01"
                    >
                        Create Account
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-sm text-muted"
                    >
                        Join ThriftGram today
                    </motion.p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="space-y-2"
                        >
                            <Input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="bg-background border-border focus:border-primary text-foreground placeholder:text-muted h-12 transition-all duration-300 hover:border-primary/50"
                            />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="space-y-2"
                        >
                            <Input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-background border-border focus:border-primary text-foreground placeholder:text-muted h-12 transition-all duration-300 hover:border-primary/50"
                            />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                            className="space-y-2"
                        >
                            <Input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-background border-border focus:border-primary text-foreground placeholder:text-muted h-12 transition-all duration-300 hover:border-primary/50"
                            />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 }}
                            className="space-y-2"
                        >
                            <Input
                                type="password"
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="bg-background border-border focus:border-primary text-foreground placeholder:text-muted h-12 transition-all duration-300 hover:border-primary/50"
                            />
                        </motion.div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 text-center overflow-hidden"
                        >
                            {error}
                        </motion.div>
                    )}

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-6 shadow-md transition-all"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Creating Account...
                                </div>
                            ) : 'Sign Up'}
                        </Button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.85 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Button
                            type="button"
                            onClick={() => handleGoogleLogin()}
                            className="w-full bg-background border border-border text-foreground hover:border-primary font-medium py-6 shadow-md transition-all flex items-center justify-center gap-2"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Sign up with Google
                        </Button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        className="text-center text-sm"
                    >
                        <span className="text-muted">Already have an account? </span>
                        <Link href="/login" className="font-medium text-primary hover:text-secondary transition-colors relative group">
                            Sign in
                            <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full" />
                        </Link>
                    </motion.div>
                </form>
            </motion.div>

            {/* Cold Start Loader */}
            <ColdStartLoader show={showColdStartLoader} />
        </main>
    );
}
