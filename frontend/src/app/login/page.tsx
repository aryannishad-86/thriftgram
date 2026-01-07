'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import api, { coldStartEvents } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff, ArrowRight, Sparkles, Leaf, Recycle, Heart } from 'lucide-react';
import RippleText from '@/components/RippleText';
import ColdStartLoader from '@/components/ColdStartLoader';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [showColdStartLoader, setShowColdStartLoader] = useState(false);

    // Subscribe to cold start events
    useEffect(() => {
        const unsubscribe = coldStartEvents.subscribe(setShowColdStartLoader);
        return () => {
            unsubscribe();
        };
    }, []);



    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, -150]);
    const y3 = useTransform(scrollYProgress, [0, 1], [0, 100]);
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
            const response = await api.post('/api/token/', {
                username,
                password,
            });

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
                console.log('Google Login Response:', res.data); // DEBUG LOG
                // ALERT FOR DEBUGGING
                alert(JSON.stringify(res.data, null, 2));

                localStorage.setItem('access_token', res.data.access);
                localStorage.setItem('refresh_token', res.data.refresh);
                if (res.data.user) {
                    localStorage.setItem('username', res.data.user.username);
                }
                console.log('Token saved to localStorage:', localStorage.getItem('access_token')); // DEBUG LOG
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
        <main ref={containerRef} className="min-h-screen w-full bg-base-3 relative selection:bg-primary/20">
            {/* Subtle Background Pattern */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-base-3" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.03]" />
                <div className="absolute inset-0 bg-gradient-to-br from-base-2/30 via-transparent to-base-2/20" />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row min-h-screen">
                {/* Left Side - Branding (Sticky) */}
                <motion.div
                    style={{ opacity }}
                    className="lg:sticky lg:top-0 lg:h-screen lg:w-1/2 flex items-center justify-center p-8 lg:p-16 relative overflow-hidden"
                >
                    <div className="relative z-10 space-y-10 w-full">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, type: "spring" }}
                        >
                            <h1 className="text-6xl lg:text-8xl font-black tracking-tight leading-none">
                                <RippleText text="Sustainable style," className="text-base-03" />
                            </h1>
                            <h1 className="text-6xl lg:text-8xl font-black tracking-tight leading-none -mt-4 lg:-mt-8">
                                <RippleText text="reimagined." className="text-base-03" />
                            </h1>
                        </motion.div>
                        <p className="text-lg text-base-02 leading-relaxed max-w-lg">
                            Join the community of conscious fashion enthusiasts. Discover unique pieces, sell your pre-loved items, and make a difference.
                        </p>

                        <div className="flex items-center gap-4 pt-6">
                            <div className="flex -space-x-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-12 h-12 rounded-full border-2 border-base-2 bg-card flex items-center justify-center text-xs font-bold text-primary">
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                ))}
                            </div>
                            <div className="text-sm text-base-02 font-medium">
                                <span className="text-primary font-bold">10k+</span> active thrifters
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-8 lg:bottom-16 left-8 lg:left-16 text-xs text-base-01">
                        © 2024 ThriftGram Inc. All rights reserved.
                    </div>
                </motion.div>

                {/* Right Side - Login Form (Scrollable) */}
                <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 lg:p-12">
                    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center w-full">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-lg relative overflow-hidden"
                        >
                            {/* Subtle top accent */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-primary" />

                            <div className="mb-10 text-center">
                                <h2 className="text-3xl font-bold text-base-03 mb-3">Welcome Back</h2>
                                <p className="text-base-01 text-sm">Enter your details to access your account</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-7">
                                <div className="space-y-5">
                                    <div className="relative group">
                                        <motion.label
                                            animate={{
                                                y: focusedInput === 'username' || username ? -24 : 0,
                                                scale: focusedInput === 'username' || username ? 0.85 : 1,
                                                color: focusedInput === 'username' ? '#268bd2' : '#93a1a1'
                                            }}
                                            className="absolute left-3 top-3 text-muted pointer-events-none origin-left transition-colors"
                                        >
                                            Username
                                        </motion.label>
                                        <Input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            onFocus={() => setFocusedInput('username')}
                                            onBlur={() => setFocusedInput(null)}
                                            className="bg-background border-border focus:border-primary text-foreground h-12 pt-4 transition-all duration-300 hover:border-primary/50"
                                        />
                                    </div>

                                    <div className="relative group">
                                        <motion.label
                                            animate={{
                                                y: focusedInput === 'password' || password ? -24 : 0,
                                                scale: focusedInput === 'password' || password ? 0.85 : 1,
                                                color: focusedInput === 'password' ? '#268bd2' : '#93a1a1'
                                            }}
                                            className="absolute left-3 top-3 text-muted pointer-events-none origin-left transition-colors"
                                        >
                                            Password
                                        </motion.label>
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onFocus={() => setFocusedInput('password')}
                                            onBlur={() => setFocusedInput(null)}
                                            className="bg-background border-border focus:border-primary text-foreground h-12 pt-4 pr-10 transition-all duration-300 hover:border-primary/50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3 text-muted hover:text-primary transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end">
                                    <Link href="#" className="text-sm text-primary hover:text-accent transition-colors">
                                        Forgot password?
                                    </Link>
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 text-center"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-primary/90 transition-all duration-300 flex items-center justify-center gap-2 group"
                                >
                                    {loading ? (
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    ) : (
                                        <>
                                            Sign In
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
                                    className="w-full bg-background border border-border text-foreground font-medium py-3.5 rounded-xl hover:border-primary transition-all duration-300 flex items-center justify-center gap-3"
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
                                    Google
                                </motion.button>

                                <div className="mt-8 text-center">
                                    <p className="text-sm text-muted">
                                        Don't have an account?{' '}
                                        <Link href="/register" className="text-primary hover:text-accent font-medium transition-colors relative group">
                                            Sign up
                                            <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-accent transition-all duration-300 group-hover:w-full" />
                                        </Link>
                                    </p>
                                </div>
                            </form>
                        </motion.div>
                    </div>

                    {/* Features Section (Scroll Target) */}
                    <div className="w-full max-w-2xl mt-24 space-y-24 pb-24">
                        {[
                            {
                                icon: Leaf,
                                title: "Eco-Conscious",
                                description: "Every purchase reduces waste and supports a sustainable future for fashion.",
                                color: "text-green-400",
                                gradient: "from-green-400/20 to-emerald-500/20"
                            },
                            {
                                icon: Recycle,
                                title: "Circular Economy",
                                description: "Give pre-loved items a second life and earn rewards for your contribution.",
                                color: "text-blue-400",
                                gradient: "from-blue-400/20 to-cyan-500/20"
                            },
                            {
                                icon: Heart,
                                title: "Community Driven",
                                description: "Connect with like-minded thrifters who share your passion for style and planet.",
                                color: "text-pink-400",
                                gradient: "from-pink-400/20 to-rose-500/20"
                            }
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.8, delay: index * 0.2 }}
                                className="flex gap-6 items-start group"
                            >
                                <div className={`p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} border border-white/5 backdrop-blur-sm group-hover:scale-110 transition-transform duration-500`}>
                                    <feature.icon className={`w-8 h-8 ${feature.color}`} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2">{feature.title}</h3>
                                    <p className="text-muted-foreground text-lg leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Cold Start Loader */}
            <ColdStartLoader show={showColdStartLoader} />
        </main >
    );
}
