'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!username || !password) {
            setError('Please fill in all fields');
            setLoading(false);
            return;
        }

        try {
            const response = await api.post('/token/', {
                username,
                password,
            });

            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            localStorage.setItem('username', username);

            // Force a hard reload to ensure all components (Navbar) pick up the new state
            window.location.href = '/';
        } catch (error: any) {
            console.error('Login failed:', error);
            setError('Login failed! Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-black p-4 relative overflow-hidden selection:bg-primary/30">
            {/* Dynamic Background Gradient */}
            <div className="absolute inset-0 -z-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black" />

            {/* Background Image with Overlay */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ duration: 1.5 }}
                className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat mix-blend-overlay"
                style={{ backgroundImage: "url('/hero-bg.jpeg')" }}
            />

            {/* Animated Gradient Mesh */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-primary/10 via-transparent to-accent/10 animate-pulse" />
            <div className="absolute inset-0 -z-10 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            {/* Fluid Background Orbs */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 0],
                    x: [0, 100, 0],
                    y: [0, -50, 0]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/4 left-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]"
            />
            <motion.div
                animate={{
                    scale: [1, 1.5, 1],
                    rotate: [0, -60, 0],
                    x: [0, -100, 0],
                    y: [0, 100, 0]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-1/4 right-1/4 -z-10 h-[600px] w-[600px] rounded-full bg-accent/10 blur-[120px]"
            />
            <motion.div
                animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.1, 1],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-[800px] w-[800px] rounded-full bg-purple-900/10 blur-[100px]"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 20 }}
                className="w-full max-w-md space-y-8 rounded-3xl border border-white/10 bg-black/40 p-8 backdrop-blur-2xl shadow-[0_0_60px_-15px_rgba(109,40,217,0.3)] relative group"
            >
                {/* Subtle Border Glow */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10 blur-xl" />

                <div className="text-center space-y-2">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/60"
                    >
                        Welcome Back
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-sm text-muted-foreground"
                    >
                        Enter your credentials to access your account
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
                                className="bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 text-white placeholder:text-muted-foreground/50 h-12 transition-all duration-300 hover:bg-white/10"
                            />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="space-y-2"
                        >
                            <Input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 text-white placeholder:text-muted-foreground/50 h-12 transition-all duration-300 hover:bg-white/10"
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
                        transition={{ delay: 0.6 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-primary via-purple-600 to-accent hover:opacity-90 text-white font-medium py-6 shadow-lg shadow-primary/25 transition-all"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Signing in...
                                </div>
                            ) : 'Sign In'}
                        </Button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="text-center text-sm"
                    >
                        <span className="text-muted-foreground">Don't have an account? </span>
                        <Link href="/register" className="font-medium text-primary hover:text-accent transition-colors relative group">
                            Sign up
                            <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-accent transition-all group-hover:w-full" />
                        </Link>
                    </motion.div>
                </form>
            </motion.div>
        </main>
    );
}
