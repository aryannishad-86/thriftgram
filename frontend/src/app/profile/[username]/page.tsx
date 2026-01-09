'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Edit, Instagram, Twitter, Globe, Users } from 'lucide-react';
import Image from 'next/image';
import api from '@/lib/api';
import Feed from '@/components/Feed';
import FollowButton from '@/components/FollowButton';

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
            <div className="min-h-screen bg-background flex items-center justify-center pt-20">
                <div className="text-base-02">Loading profile...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center pt-20">
                <div className="text-base-02">User not found</div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-background pt-24 pb-12 px-4">
            <div className="container mx-auto max-w-4xl">
                {/* Profile Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-3xl p-8 mb-8 shadow-sm"
                >
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        {/* Profile Picture */}
                        <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-border bg-base-2 flex-shrink-0">
                            {user.profile_picture ? (
                                <Image
                                    src={user.profile_picture}
                                    alt={user.username}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <User className="h-16 w-16 text-base-01" />
                                </div>
                            )}
                        </div>

                        {/* Profile Info */}
                        <div className="flex-1">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-base-03">@{user.username}</h1>
                                    {user.bio && <p className="mt-2 text-base-02">{user.bio}</p>}
                                </div>

                                {isOwnProfile ? (
                                    <button
                                        onClick={() => router.push('/profile/edit')}
                                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-base-2 text-base-03 border border-border hover:bg-base-1 transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
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

                            {/* Stats */}
                            <div className="flex gap-6 mb-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-base-03">{user.followers_count}</div>
                                    <div className="text-sm text-base-02">Followers</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-base-03">{user.following_count}</div>
                                    <div className="text-sm text-base-02">Following</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-base-03">{user.eco_points}</div>
                                    <div className="text-sm text-base-02">Eco Points</div>
                                </div>
                            </div>

                            {/* Social Links */}
                            {user.social_links && Object.keys(user.social_links).length > 0 && (
                                <div className="flex gap-3">
                                    {user.social_links.instagram && (
                                        <a
                                            href={`https://instagram.com/${user.social_links.instagram.replace('@', '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 rounded-full bg-base-2 text-base-03 hover:bg-primary hover:text-white transition-colors"
                                        >
                                            <Instagram className="w-5 h-5" />
                                        </a>
                                    )}
                                    {user.social_links.twitter && (
                                        <a
                                            href={`https://twitter.com/${user.social_links.twitter.replace('@', '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 rounded-full bg-base-2 text-base-03 hover:bg-primary hover:text-white transition-colors"
                                        >
                                            <Twitter className="w-5 h-5" />
                                        </a>
                                    )}
                                    {user.social_links.website && (
                                        <a
                                            href={user.social_links.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 rounded-full bg-base-2 text-base-03 hover:bg-primary hover:text-white transition-colors"
                                        >
                                            <Globe className="w-5 h-5" />
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* Eco Impact */}
                            <div className="mt-4 flex gap-4 text-sm">
                                <div className="flex items-center gap-2 text-base-02">
                                    <span className="font-semibold text-success">{user.co2_saved.toFixed(1)}kg</span>
                                    CO₂ saved
                                </div>
                                <div className="flex items-center gap-2 text-base-02">
                                    <span className="font-semibold text-base-03">{user.water_saved.toFixed(0)}L</span>
                                    Water saved
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* User's Listings */}
                <div>
                    <h2 className="text-2xl font-bold text-base-03 mb-6">Listings</h2>
                    <Feed filters={{ seller_username: username }} />
                </div>
            </div>
        </main>
    );
}
