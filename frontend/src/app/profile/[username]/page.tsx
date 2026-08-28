'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { UserX, Edit, Instagram, Twitter, Globe } from 'lucide-react';
import api from '@/lib/api';
import Feed from '@/components/Feed';
import FollowButton from '@/components/FollowButton';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageShell } from '@/components/layout/page-shell';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';

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
    const [loadFailed, setLoadFailed] = useState(false);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isOwnProfile, setIsOwnProfile] = useState(false);

    const fetchUser = useCallback(async () => {
        setLoading(true);
        setLoadFailed(false);
        try {
            const response = await api.get(`/api/users/${username}/`);
            setUser(response.data);

            // Check if this is the current user's profile
            const currentUsername = localStorage.getItem('username');
            setIsOwnProfile(currentUsername === username);
        } catch (err) {
            console.error(err);
            // Only a real 404 means "this user doesn't exist". Any other
            // failure (500, network down, timeout) is a load error — the old
            // code rendered "User not found" for all of them, which tells a
            // visitor a real person's profile is gone whenever the backend
            // hiccups.
            const status = (err as { response?: { status?: number } }).response?.status;
            setLoadFailed(status !== 404);
        } finally {
            setLoading(false);
        }
    }, [username]);

    useEffect(() => {
        if (username) {
            fetchUser();
        }
    }, [username, fetchUser]);

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

    if (loadFailed) {
        return (
            <PageShell maxWidth="4xl">
                <ErrorState subject="this profile" onRetry={fetchUser} />
            </PageShell>
        );
    }

    if (!user) {
        return (
            <PageShell maxWidth="4xl">
                <EmptyState
                    icon={UserX}
                    title="User not found"
                    description={`No account exists with the username @${username}.`}
                />
            </PageShell>
        );
    }

    return (
        <PageShell maxWidth="4xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <Card padding="lg">
                    <div className="flex flex-col items-start gap-6 md:flex-row">
                        <Avatar src={user.profile_picture} name={user.username} size="2xl" />

                        <div className="flex-1">
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <p className="label-meta mb-2 text-muted">Thrifter Profile</p>
                                    <h1 className="font-display text-3xl font-semibold text-foreground">@{user.username}</h1>
                                    {user.bio && <p className="mt-2 text-muted-foreground">{user.bio}</p>}
                                </div>

                                {isOwnProfile ? (
                                    <button
                                        onClick={() => router.push('/profile/edit')}
                                        className="flex items-center gap-2 border border-border bg-base-2 px-4 py-2 text-foreground transition-colors hover:bg-base-1"
                                    >
                                        <Edit className="h-4 w-4" />
                                        <span className="label-meta text-foreground">Edit Profile</span>
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
                                <div>
                                    <div className="font-mono text-2xl text-foreground">{user.followers_count}</div>
                                    <div className="label-meta text-muted">Followers</div>
                                </div>
                                <div>
                                    <div className="font-mono text-2xl text-foreground">{user.following_count}</div>
                                    <div className="label-meta text-muted">Following</div>
                                </div>
                                <div>
                                    <div className="font-mono text-2xl text-primary">{user.eco_points}</div>
                                    <div className="label-meta text-muted">Eco Points</div>
                                </div>
                            </div>

                            {user.social_links && Object.keys(user.social_links).length > 0 && (
                                <div className="flex gap-3">
                                    {user.social_links.instagram && (
                                        <a
                                            href={`https://instagram.com/${user.social_links.instagram.replace('@', '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="rounded-full bg-base-2 p-2 text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                                        >
                                            <Instagram className="h-5 w-5" />
                                        </a>
                                    )}
                                    {user.social_links.twitter && (
                                        <a
                                            href={`https://twitter.com/${user.social_links.twitter.replace('@', '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="rounded-full bg-base-2 p-2 text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                                        >
                                            <Twitter className="h-5 w-5" />
                                        </a>
                                    )}
                                    {user.social_links.website && (
                                        <a
                                            href={user.social_links.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="rounded-full bg-base-2 p-2 text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                                        >
                                            <Globe className="h-5 w-5" />
                                        </a>
                                    )}
                                </div>
                            )}

                            <div className="mt-4 flex gap-2">
                                <Badge variant="success" size="sm">{user.co2_saved.toFixed(1)}kg CO₂ saved</Badge>
                                <Badge variant="outline" size="sm">{user.water_saved.toFixed(0)}L water saved</Badge>
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>

            <Separator className="mb-10" />

            <div>
                <p className="label-meta mb-3 text-muted">The Rack</p>
                <h2 className="font-display mb-6 text-2xl font-semibold text-foreground">Listings</h2>
                <Feed filters={{ seller_username: username }} />
            </div>
        </PageShell>
    );
}
