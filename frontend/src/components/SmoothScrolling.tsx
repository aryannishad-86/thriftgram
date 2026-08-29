"use client";

import { useSyncExternalStore } from "react";
import { ReactLenis } from "lenis/react";

// prefers-reduced-motion is a real external, subscribable browser API —
// useSyncExternalStore is the correct primitive for it, not an effect that
// calls setState on mount (eslint's react-hooks/set-state-in-effect flags
// that: it's an extra synchronous render pass for something with a proper
// subscription primitive instead). Same pattern as Gallery.tsx's shader/CSS
// gallery switch. getServerSnapshot returns false so SSR and first paint
// agree with what hydration will initially show.
function subscribeToReducedMotionChange(callback: () => void) {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {};
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    mq.addEventListener('change', callback);
    return () => mq.removeEventListener('change', callback);
}

function getReducedMotionSnapshot() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getServerSnapshot() {
    return false;
}

function SmoothScrolling({ children }: { children: React.ReactNode }) {
    // Lenis previously ran unconditionally, ignoring prefers-reduced-motion.
    // Users who've asked the OS for reduced motion get native scroll instead.
    const reducedMotion = useSyncExternalStore(
        subscribeToReducedMotionChange,
        getReducedMotionSnapshot,
        getServerSnapshot
    );

    if (reducedMotion) {
        return <>{children}</>;
    }

    return (
        <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
            {children}
        </ReactLenis>
    );
}

export default SmoothScrolling;
