'use client';

import { useState } from 'react';
import { UserPlus, UserMinus } from 'lucide-react';
import api from '@/lib/api';

interface FollowButtonProps {
    username: string;
    initialIsFollowing: boolean;
    onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({ username, initialIsFollowing, onFollowChange }: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [loading, setLoading] = useState(false);

    const handleFollow = async () => {
        setLoading(true);
        try {
            if (isFollowing) {
                await api.delete(`/api/users/${username}/unfollow/`);
                setIsFollowing(false);
                onFollowChange?.(false);
            } else {
                await api.post(`/api/users/${username}/follow/`);
                setIsFollowing(true);
                onFollowChange?.(true);
            }
        } catch (error) {
            console.error('Failed to update follow status', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleFollow}
            disabled={loading}
            className={`
                px-6 py-2 rounded-full font-semibold transition-all flex items-center gap-2
                ${isFollowing
                    ? 'bg-base-2 text-base-03 border border-border hover:bg-error/10 hover:text-error hover:border-error'
                    : 'bg-primary text-white hover:bg-primary/90'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
            `}
        >
            {isFollowing ? (
                <>
                    <UserMinus className="w-4 h-4" />
                    Unfollow
                </>
            ) : (
                <>
                    <UserPlus className="w-4 h-4" />
                    Follow
                </>
            )}
        </button>
    );
}
