'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import api, { coldStartEvents } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { useGoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff, ArrowRight, Sparkles, Leaf, Recycle, Heart } from 'lucide-react';
import RippleText from '@/components/RippleText';
import ColdStartLoader from '@/components/ColdStartLoader';

const FEATURES = [
    {
        icon: Leaf,
        title: "Eco-Conscious",
        description: "Every purchase reduces waste and supports a sustainable future for fashion.",
        color: "text-success",
    },
    {
        icon: Recycle,
        title: "Circular Economy",
        description: "Give pre-loved items a second life and earn rewards for your contribution.",
        color: "text-primary",
    },
    {
        icon: Heart,
        title: "Community Driven",
        description: "Connect with like-minded thrifters who share your passion for style and planet.",
        color: "text-error",
    },
];

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [showColdStartLoader, setShowColdStartLoader] = useState(false);

    useEffect(() => {
        const unsubscribe = coldStartEvents.subscribe(setShowColdStartLoader);
        return () => { unsubscribe(); };
    }, []);

    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

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
            const response = await api.post('/api/token/', { username, password });
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            localStorage.setItem('username', username);
            window.location.href = '/';
        } catch (error: any) {
            console.error('Login failed:', error);
            setError('Login failed! Please check your credentials.');
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
        onError: () => setError('Google login failed'),
    });

    return (
        <main ref={containerRef} className="relative min-h-screen w-full bg-background selection:bg-primary/20">
            <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
                {/* Left — Branding (sticky, fades out as the features section scrolls past) */}
                <motion.div
                    style={{ opacity }}
                    className="relative flex items-center justify-center overflow-hidden p-8 lg:sticky lg:top-0 lg:h-screen lg:w-1/2 lg:p-16"
                >
                    <div className="relative z-10 w-full space-y-10">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, type: "spring" }}
                        >
                            <h1 className="text-6xl font-black leading-none tracking-tight lg:text-8xl">
                                <RippleText text="Sustainable style," className="text-ink" />
                            </h1>
                            <h1 className="-mt-4 text-6xl font-black leading-none tracking-tight lg:-mt-8 lg:text-8xl">
                                <RippleText text="reimagined." className="text-ink" />
                            </h1>
                        </motion.div>
                        <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
                            Join the community of conscious fashion enthusiasts. Discover unique pieces, sell your pre-loved items, and make a difference.
                        </p>

                        <div className="flex items-center gap-4 pt-6">
                            <div className="flex -space-x-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-background bg-card text-xs font-bold text-foreground">
                                        <Sparkles className="h-4 w-4" />
                                    </div>
                                ))}
                            </div>
                            <div className="text-sm font-medium text-muted-foreground">
                                <span className="font-bold text-foreground">Growing</span> community of thrifters
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-8 left-8 text-xs text-muted lg:bottom-16 lg:left-16">
                        © {new Date().getFullYear()} ThriftGram Inc. All rights reserved.
                    </div>
                </motion.div>

                {/* Right — Form (scrollable) */}
                <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2 lg:p-12">
                    <div className="flex min-h-[calc(100vh-6rem)] w-full items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-lg"
                        >
                            <div className="absolute left-0 top-0 h-1 w-full bg-primary" />

                            <div className="mb-10 text-center">
                                <h2 className="mb-3 text-3xl font-bold text-foreground">Welcome Back</h2>
                                <p className="text-sm text-muted">Enter your details to access your account</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-7">
                                <div className="space-y-5">
                                    <div className="relative group">
                                        <motion.label
                                            animate={{
                                                y: focusedInput === 'username' || username ? -24 : 0,
                                                scale: focusedInput === 'username' || username ? 0.85 : 1,
                                                // framer-motion needs a literal to interpolate — mirrors --primary/--muted
                                                color: focusedInput === 'username' ? '#1A47E8' : '#6E6E73'
                                            }}
                                            className={`pointer-events-none absolute left-3 top-3 z-10 origin-left px-1 text-muted transition-colors ${focusedInput === 'username' || username ? 'bg-card' : ''}`}
                                        >
                                            Username
                                        </motion.label>
                                        <Input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            onFocus={() => setFocusedInput('username')}
                                            onBlur={() => setFocusedInput(null)}
                                            className="h-12 pt-4 hover:border-primary/50"
                                        />
                                    </div>

                                    <div className="relative group">
                                        <motion.label
                                            animate={{
                                                y: focusedInput === 'password' || password ? -24 : 0,
                                                scale: focusedInput === 'password' || password ? 0.85 : 1,
                                                color: focusedInput === 'password' ? '#1A47E8' : '#6E6E73'
                                            }}
                                            className={`pointer-events-none absolute left-3 top-3 z-10 origin-left px-1 text-muted transition-colors ${focusedInput === 'password' || password ? 'bg-card' : ''}`}
                                        >
                                            Password
                                        </motion.label>
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onFocus={() => setFocusedInput('password')}
                                            onBlur={() => setFocusedInput(null)}
                                            className="h-12 pr-10 pt-4 hover:border-primary/50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3 text-muted transition-colors hover:text-foreground"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                {error && <Alert variant="error">{error}</Alert>}

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-bold text-primary-foreground shadow-md transition-all duration-300 hover:bg-primary-hover"
                                >
                                    {loading ? (
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    ) : (
                                        <>
                                            Sign In
                                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </>
                                    )}
                                </motion.button>

                                <div className="relative my-8">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-border" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-card px-2 text-muted">Or continue with</span>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="button"
                                    onClick={() => handleGoogleLogin()}
                                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background py-3.5 font-medium text-foreground transition-all duration-300 hover:border-primary"
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Google
                                </motion.button>

                                <div className="mt-8 text-center">
                                    <p className="text-sm text-muted">
                                        Don&apos;t have an account?{' '}
                                        <Link href="/register" className="group relative font-medium text-foreground transition-colors hover:text-accent">
                                            Sign up
                                            <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-accent transition-all duration-300 group-hover:w-full" />
                                        </Link>
                                    </p>
                                </div>
                            </form>
                        </motion.div>
                    </div>

                    {/* Features (scroll target) */}
                    <div className="mt-24 w-full max-w-2xl space-y-24 pb-24">
                        {FEATURES.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.8, delay: index * 0.2 }}
                                className="group flex items-start gap-6"
                            >
                                <div className="rounded-2xl border border-border bg-base-2 p-4 transition-transform duration-500 group-hover:scale-110">
                                    <feature.icon className={`h-8 w-8 ${feature.color}`} />
                                </div>
                                <div>
                                    <h3 className="font-display mb-2 text-2xl font-semibold text-foreground">{feature.title}</h3>
                                    <p className="text-lg leading-relaxed text-muted-foreground">
                                        {feature.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <ColdStartLoader show={showColdStartLoader} />
        </main>
    );
}
