export interface FeaturedItem {
    id: number;
    title: string;
    price: string;
    images: { id: number; image: string }[];
    seller: { username: string };
}
