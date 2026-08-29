'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cloudinaryUrl, isCloudinary } from '@/lib/cloudinary';
import styles from './WaveGallery.module.css';
import type { FeaturedItem } from './types';

/**
 * The CSS-only gallery. This is the fallback for the three.js version
 * (ShaderGallery) — and per the plan, the fallback IS the real deliverable,
 * not an apology for missing WebGL. It has to look good entirely on its own,
 * since most visitors (mobile, reduced-motion, older GPUs) will only ever
 * see this one.
 *
 * Was its own data-fetching component; now a pure renderer. Gallery.tsx
 * fetches /api/items/featured/ once and decides marquee vs. this vs.
 * ShaderGallery from that single result — this used to fetch independently,
 * which meant switching between fallback paths re-fetched and re-flashed a
 * loading skeleton for no reason.
 */
export default function WaveGallery({ items }: { items: FeaturedItem[] }) {
    return (
        <section className={styles.wrapper}>
            <div>
                <h2 className={`${styles.sectionTitle} font-display`}>Featured Collection</h2>
                <div className={styles.gallery}>
                    {items.map((item) => {
                        const rawImage =
                            item.images.length > 0
                                ? item.images[0].image
                                : '/placeholder.jpg';
                        // One shared 3:4 frame with subject-aware cropping —
                        // this is what makes a row of arbitrary phone photos
                        // read as a gallery rather than a pile.
                        const image = cloudinaryUrl(rawImage, { width: 600, aspect: '3:4' });
                        return (
                            <Link
                                key={item.id}
                                href={`/items/${item.id}`}
                                className={styles.item}
                            >
                                <Image
                                    src={image}
                                    alt={item.title}
                                    fill
                                    sizes="(max-width: 768px) 40vw, 20vw"
                                    unoptimized={isCloudinary(rawImage)}
                                    className="object-cover"
                                />
                                <div className={styles.overlay}>
                                    <span className={styles.price}>
                                        ₹{item.price}
                                    </span>
                                    <span className={styles.title}>
                                        {item.title}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
