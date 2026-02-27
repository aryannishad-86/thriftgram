'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
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
                const data = response.data.results || response.data;
                setItems(data);
            } catch (err) {
                console.error('Failed to load featured items:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchFeatured();
    }, []);

    // Don't render the section if there are no items and not loading
    if (!loading && items.length === 0) {
        return null;
    }

    return (
        <section className={styles.wrapper}>
            <div>
                <h2 className={styles.sectionTitle}>Featured Collection</h2>
                <div className={styles.gallery}>
                    {loading
                        ? Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className={`${styles.item} ${styles.skeleton}`} />
                        ))
                        : items.map((item) => {
                            const image =
                                item.images.length > 0
                                    ? item.images[0].image
                                    : '/placeholder.jpg';
                            return (
                                <Link
                                    key={item.id}
                                    href={`/items/${item.id}`}
                                    className={styles.item}
                                >
                                    <img
                                        src={image}
                                        alt={item.title}
                                        loading="lazy"
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
