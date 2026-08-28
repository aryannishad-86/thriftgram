'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cloudinaryUrl, isCloudinary } from '@/lib/cloudinary';
import api, { unwrap } from '@/lib/api';
import styles from './WaveGallery.module.css';

interface FeaturedItem {
    id: number;
    title: string;
    price: string;
    images: { id: number; image: string }[];
    seller: { username: string };
}

export default function WaveGallery() {
    const [items, setItems] = useState<FeaturedItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                const response = await api.get('/api/items/featured/');
                setItems(unwrap<FeaturedItem>(response));
            } catch (err) {
                console.error('Failed to load featured items:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchFeatured();
    }, []);

    if (!loading && items.length === 0) {
        return null;
    }

    return (
        <section className={styles.wrapper}>
            <div>
                <h2 className={`${styles.sectionTitle} font-display`}>Featured Collection</h2>
                <div className={styles.gallery}>
                    {loading
                        ? Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className={`${styles.item} ${styles.skeleton}`} />
                        ))
                        : items.map((item) => {
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
