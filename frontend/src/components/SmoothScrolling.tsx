"use client";

import { useEffect, useState } from "react";
import { ReactLenis } from "lenis/react";

function SmoothScrolling({ children }: { children: React.ReactNode }) {
    // Lenis previously ran unconditionally, ignoring prefers-reduced-motion.
    // Users who've asked the OS for reduced motion get native scroll instead.
    const [reducedMotion, setReducedMotion] = useState(false);

    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReducedMotion(query.matches);
        const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
        query.addEventListener('change', handler);
        return () => query.removeEventListener('change', handler);
    }, []);

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
