'use client';

import styles from './WaveGallery.module.css';

// Midjourney images array
const GALLERY_IMAGES = [
    'https://cdn.midjourney.com/b4f5c014-d534-476c-916d-7f9addc9eb19/0_0.png',
    'https://cdn.midjourney.com/7e50b758-693d-4710-a4fb-d7c94a6ebd1f/0_0.png',
    'https://cdn.midjourney.com/3994c537-cbdf-4b64-8787-687d655e3af9/0_0.png',
    'https://cdn.midjourney.com/4cda6391-7160-4cde-85a0-4d8a076b6832/0_0.png',
    'https://cdn.midjourney.com/0a17fedc-5a8e-42e4-8d2d-d46674b4ca5e/0_0.png',
    'https://cdn.midjourney.com/f9ceb9f8-f7a8-4bf8-bcf9-0120cf04f935/0_0.png',
    'https://cdn.midjourney.com/8e45e246-d424-40e7-a2c3-c4e0ac82162f/0_0.png',
    'https://cdn.midjourney.com/6e325959-82f9-46f1-9f68-8c19a283c3be/0_0.png',
];

// Generate 12 items by cycling through the 8 images
const galleryItems = Array.from({ length: 12 }, (_, index) => ({
    id: index,
    image: GALLERY_IMAGES[index % GALLERY_IMAGES.length],
    alt: `Gallery item ${index + 1}`,
}));

export default function WaveGallery() {
    return (
        <section className={styles.wrapper}>
            <div>
                <h2 className={styles.sectionTitle}>Featured Collection</h2>
                <div className={styles.gallery}>
                    {galleryItems.map((item) => (
                        <div key={item.id} className={styles.item}>
                            <img
                                src={item.image}
                                alt={item.alt}
                                loading="lazy"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
