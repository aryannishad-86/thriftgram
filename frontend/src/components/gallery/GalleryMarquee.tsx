'use client';

import Link from 'next/link';
import type { FeaturedItem } from './types';

/**
 * The photo-optional path. Below ~6 photos neither gallery (CSS wave or
 * three.js) has enough content to read as a "collection" — a row of 1-3
 * items looks like a bug, not a gallery. This is the design's other stated
 * bet: the identity has to hold up on typography alone. A scrolling marquee
 * of titles carries the section instead of apologizing for the empty space.
 *
 * Below the threshold entirely (zero items) this renders nothing, same as
 * the old WaveGallery's empty-state behaviour.
 */
export default function GalleryMarquee({ items }: { items: FeaturedItem[] }) {
    if (items.length === 0) return null;

    // Repeat the list so the CSS marquee has enough content to loop
    // seamlessly regardless of how few real items exist.
    const looped = [...items, ...items, ...items];

    return (
        <section className="overflow-hidden border-y border-border py-10">
            <div className="flex w-max animate-[marquee_28s_linear_infinite] gap-12 whitespace-nowrap">
                {looped.map((item, i) => (
                    <Link
                        key={`${item.id}-${i}`}
                        href={`/items/${item.id}`}
                        className="group flex items-baseline gap-4 transition-colors hover:text-primary"
                    >
                        <span className="font-display text-4xl font-semibold text-foreground group-hover:text-primary sm:text-5xl">
                            {item.title}
                        </span>
                        <span className="label-meta text-muted">₹{item.price}</span>
                        <span className="text-muted" aria-hidden="true">
                            ・
                        </span>
                    </Link>
                ))}
            </div>
            <style jsx>{`
                @keyframes marquee {
                    from {
                        transform: translateX(0);
                    }
                    to {
                        transform: translateX(-33.3333%);
                    }
                }
                @media (prefers-reduced-motion: reduce) {
                    div {
                        animation: none !important;
                    }
                }
            `}</style>
        </section>
    );
}
