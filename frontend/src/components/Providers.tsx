'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { CartProvider } from "@/context/CartContext";

export function Providers({ children }: { children: React.ReactNode }) {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

    if (clientId === "YOUR_GOOGLE_CLIENT_ID") {
        console.error("Google Client ID is not set! Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your .env.local file.");
    }

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <CartProvider>
                {children}
            </CartProvider>
        </GoogleOAuthProvider>
    );
}
