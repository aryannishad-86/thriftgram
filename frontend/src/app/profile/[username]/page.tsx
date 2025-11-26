'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import Feed from '@/components/Feed';
import { User } from 'lucide-react';
import Image from 'next/image';

interface UserProfile {
    id: number;
    username: string;
    bio: string;
    profile_picture: string | null;
}

export default function ProfilePage() {
    const params = useParams();
    const username = params.username as string;
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get(`/users/${username}/`);
                setUser(response.data);
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

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-white">Loading profile...</div>;
    }

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center text-white">User not found</div>;
    }

    return (
        <main className="min-h-screen bg-background selection:bg-primary/30 relative overflow-hidden">
            {/* Cosmic Background */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,rgba(109,40,217,0.15),transparent)]" />

            <div className="container mx-auto px-4 py-12">
                {/* Profile Header */}
                <div className="mb-12 flex flex-col items-center text-center">
                    <div className="relative mb-4 h-24 w-24 overflow-hidden rounded-full border-2 border-primary/50 bg-white/5 shadow-[0_0_30px_-10px_rgba(109,40,217,0.5)]">
                        {user.profile_picture ? (
                            <div className="relative h-full w-full">
                                <Image
                                    src={user.profile_picture}
                                    alt={user.username}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-white/5">
                                <User className="h-10 w-10 text-white/50" />
                            </div>
                        )}
                    </div>

                    <h1 className="text-3xl font-bold text-white">@{user.username}</h1>
                    {user.bio && <p className="mt-2 max-w-md text-muted-foreground">{user.bio}</p>}

                    <div className="mt-6 flex gap-4">
                        <div className="rounded-full border border-white/10 bg-white/5 px-6 py-2 text-sm font-medium text-white">
                            Seller
                        </div>
                        <button
                            onClick={() => {
                                const currentUser = localStorage.getItem('username');
                                if (!currentUser) {
                                    alert('Please login to message');
                                    window.location.href = '/login';
                                    return;
                                }
                                const participants = [currentUser, user.username].sort();
                                const roomName = `${participants[0]}_${participants[1]}`;
                                window.location.href = `/chat?room=${roomName}`;
                            }}
                            className="rounded-full bg-white/10 px-6 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors backdrop-blur-md"
                        >
                            Message
                        </button>
                        <button className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors shadow-[0_0_20px_-5px_rgba(109,40,217,0.5)]">
                            Follow
                        </button>
                    </div>
                </div>

                {/* User's Closet */}
                <div className="border-t border-white/10 pt-12">
                    <h2 className="mb-8 text-xl font-bold text-white">Closet</h2>
                    <Feed filters={{ seller_username: username }} />
                </div>
            </div>
        </main>
    );
}
