'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import api, { unwrap } from '@/lib/api';
import { canUseShaderGallery } from '@/lib/webgl-support';
import WaveGallery from './WaveGallery';
import GalleryMarquee from './GalleryMarquee';
import styles from './WaveGallery.module.css';
import type { FeaturedItem } from './types';

const MARQUEE_THRESHOLD = 6;

// prefers-reduced-motion is a real external, subscribable browser API — the
// canonical React pattern for that is useSyncExternalStore, not an effect
// that calls setState on mount (which eslint's react-hooks/set-state-in-effect
// correctly flags: it causes an extra synchronous render pass for something
// that has a proper subscription primitive instead). getServerSnapshot
// returns the CSS-fallback-safe default so SSR and first paint agree with
// what hydration will initially show, before the client-only checks resolve.
function subscribeToReducedMotionChange(callback: () => void) {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {};
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    mq.addEventListener('change', callback);
    return () => mq.removeEventListener('change', callback);
}

function getShaderGallerySnapshot() {
    return canUseShaderGallery();
}

function getServerSnapshot() {
    return false;
}

// ssr:false is the load-bearing part of this import — three.js must never
// enter the server bundle or the initial client bundle either. This is the
// first dynamic import anywhere in this app (verified before R5: zero
// next/dynamic / React.lazy usage existed anywhere in src/). The loading
// fallback is the CSS gallery, not a spinner: on a capable machine the
// three.js chunk is still a network fetch away, and showing the fallback
// gallery immediately (which already looks intentional on its own) beats a
// blank flash while webgl chunks load in.
const ShaderGallery = dynamic(() => import('./ShaderGallery'), {
    ssr: false,
    loading: () => null,
});

/**
 * Orchestrates the three possible states of the featured-items section:
 *
 *   0 items          -> render nothing (same as the old WaveGallery)
 *   < 6 items         -> GalleryMarquee (photo-optional typographic path)
 *   >= 6 items, capable -> ShaderGallery (three.js, dynamically imported)
 *   >= 6 items, not capable -> WaveGallery (CSS-only fallback)
 *
 * "Capable" is WebGL2 + not-reduced-motion + a desktop-class viewport (see
 * webgl-support.ts) — checked in an effect, not at module scope, since none
 * of those APIs exist during SSR.
 */
export default function Gallery() {
    const [items, setItems] = useState<FeaturedItem[] | null>(null);
    // Re-evaluates on prefers-reduced-motion change (an OS-level toggle a
    // user can flip mid-session) via the subscription above — WebGL2 support
    // and viewport width are re-read at the same time since they're cheap,
    // even though they're less likely to change without a remount anyway.
    const useShader = useSyncExternalStore(
        subscribeToReducedMotionChange,
        getShaderGallerySnapshot,
        getServerSnapshot
    );

    useEffect(() => {
        let cancelled = false;
        api.get('/api/items/featured/')
            .then((res) => {
                if (!cancelled) setItems(unwrap<FeaturedItem>(res));
            })
            .catch((err) => {
                console.error('Failed to load featured items:', err);
                if (!cancelled) setItems([]);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    if (items === null) {
        return (
            <section className={styles.wrapper}>
                <div>
                    <h2 className={`${styles.sectionTitle} font-display`}>Featured Collection</h2>
                    <div className={styles.gallery}>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className={`${styles.item} ${styles.skeleton}`} />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (items.length === 0) return null;
    if (items.length < MARQUEE_THRESHOLD) return <GalleryMarquee items={items} />;
    if (useShader) return <ShaderGallery items={items} />;
    return <WaveGallery items={items} />;
}
