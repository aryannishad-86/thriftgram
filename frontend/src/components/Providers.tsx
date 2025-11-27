'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { CartProvider } from "@/context/CartContext";

export function Providers({ children }: { children: React.ReactNode }) {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <CartProvider>
                {children}
            </CartProvider>
        </GoogleOAuthProvider>
    );
}
