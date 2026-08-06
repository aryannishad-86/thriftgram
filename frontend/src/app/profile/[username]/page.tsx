'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Edit, Instagram, Twitter, Globe } from 'lucide-react';
import Image from 'next/image';
import api from '@/lib/api';
import Feed from '@/components/Feed';
import FollowButton from '@/components/FollowButton';
import { Card } from '@/components/ui/card';
import { PageShell } from '@/components/layout/page-shell';

interface UserProfile {
    id: number;
    username: string;
    email: string;
    bio: string;
    profile_picture: string | null;
    social_links: {
        instagram?: string;
        twitter?: string;
        website?: string;
    };
    eco_points: number;
    co2_saved: number;
    water_saved: number;
    followers_count: number;
    following_count: number;
    is_following: boolean;
}

export default function ProfilePage() {
    const params = useParams();
    const router = useRouter();
    const username = params.username as string;
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isOwnProfile, setIsOwnProfile] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get(`/api/users/${username}/`);
                setUser(response.data);

                // Check if this is the current user's profile
                const currentUsername = localStorage.getItem('username');
                setIsOwnProfile(currentUsername === username);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (username) {
            fetchUser();
        }
    }, [username]);

    const handleFollowChange = (isFollowing: boolean) => {
        if (user) {
            setUser({
                ...user,
                is_following: isFollowing,
                followers_count: isFollowing ? user.followers_count + 1 : user.followers_count - 1
            });
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background pt-20">
                <div className="text-muted-foreground">Loading profile...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background pt-20">
                <div className="text-muted-foreground">User not found</div>
            </div>
        );
    }

    return (
        <PageShell maxWidth="4xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <Card padding="lg" className="shadow-sm">
                    <div className="flex flex-col items-start gap-6 md:flex-row">
                        <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-full border-4 border-border bg-base-2">
                            {user.profile_picture ? (
                                <Image src={user.profile_picture} alt={user.username} fill className="object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <User className="h-16 w-16 text-muted" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1">
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <h1 className="font-display text-3xl font-semibold text-foreground">@{user.username}</h1>
                                    {user.bio && <p className="mt-2 text-muted-foreground">{user.bio}</p>}
                                </div>

                                {isOwnProfile ? (
                                    <button
                                        onClick={() => router.push('/profile/edit')}
                                        className="flex items-center gap-2 rounded-full border border-border bg-base-2 px-4 py-2 text-foreground transition-colors hover:bg-base-1"
                                    >
                                        <Edit className="h-4 w-4" />
                                        Edit Profile
                                    </button>
                                ) : (
                                    <FollowButton
                                        username={username}
                                        initialIsFollowing={user.is_following}
                                        onFollowChange={handleFollowChange}
                                    />
                                )}
                            </div>

                            <div className="mb-4 flex gap-6">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-foreground">{user.followers_count}</div>
                                    <div className="text-sm text-muted-foreground">Followers</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-foreground">{user.following_count}</div>
                                    <div className="text-sm text-muted-foreground">Following</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-foreground">{user.eco_points}</div>
                                    <div className="text-sm text-muted-foreground">Eco Points</div>
                                </div>
                            </div>

                            {user.social_links && Object.keys(user.social_links).length > 0 && (
                                <div className="flex gap-3">
                                    {user.social_links.instagram && (
                                        <a
                                            href={`https://instagram.com/${user.social_links.instagram.replace('@', '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="rounded-full bg-base-2 p-2 text-foreground transition-colors hover:bg-primary hover:text-white"
                                        >
                                            <Instagram className="h-5 w-5" />
                                        </a>
                                    )}
                                    {user.social_links.twitter && (
                                        <a
                                            href={`https://twitter.com/${user.social_links.twitter.replace('@', '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="rounded-full bg-base-2 p-2 text-foreground transition-colors hover:bg-primary hover:text-white"
                                        >
                                            <Twitter className="h-5 w-5" />
                                        </a>
                                    )}
                                    {user.social_links.website && (
                                        <a
                                            href={user.social_links.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="rounded-full bg-base-2 p-2 text-foreground transition-colors hover:bg-primary hover:text-white"
                                        >
                                            <Globe className="h-5 w-5" />
                                        </a>
                                    )}
                                </div>
                            )}

                            <div className="mt-4 flex gap-4 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <span className="font-semibold text-success">{user.co2_saved.toFixed(1)}kg</span>
                                    CO₂ saved
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <span className="font-semibold text-foreground">{user.water_saved.toFixed(0)}L</span>
                                    Water saved
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>

            <div>
                <h2 className="mb-6 text-2xl font-bold text-foreground">Listings</h2>
                <Feed filters={{ seller_username: username }} />
            </div>
        </PageShell>
    );
}
