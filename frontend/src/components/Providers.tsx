'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { MotionConfig } from 'framer-motion';
import { CartProvider } from "@/context/CartContext";

export function Providers({ children }: { children: React.ReactNode }) {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

    if (clientId === "YOUR_GOOGLE_CLIENT_ID") {
        console.error("Google Client ID is not set! Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your .env.local file.");
    }

    return (
        // reducedMotion="user" makes EVERY motion.* component in the app
        // (86+ usages, verified via grep before adding this — none of them
        // were individually reduced-motion-aware) respect the OS-level
        // prefers-reduced-motion setting automatically: animations still
        // reach their final state, just without the transition. This gap
        // predates the After Hours redesign — the original Paper Editorial
        // pass only ever gated Lenis's smooth scroll, never framer-motion
        // itself. One wrapper here covers all 86+ usages; auditing each
        // individually was never necessary once this was found.
        <MotionConfig reducedMotion="user">
            <GoogleOAuthProvider clientId={clientId}>
                <CartProvider>
                    {children}
                </CartProvider>
            </GoogleOAuthProvider>
        </MotionConfig>
    );
}
