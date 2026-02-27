'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Instagram, Twitter, Globe, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function ProfileEditPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        bio: '',
        instagram: '',
        twitter: '',
        website: '',
    });

    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [currentProfilePicture, setCurrentProfilePicture] = useState('');

    // Fetch current user data
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await api.get('/api/users/me/');
                const userData = response.data;

                setFormData({
                    bio: userData.bio || '',
                    instagram: userData.social_links?.instagram || '',
                    twitter: userData.social_links?.twitter || '',
                    website: userData.social_links?.website || '',
                });

                if (userData.profile_picture) {
                    setCurrentProfilePicture(userData.profile_picture);
                    setPreviewUrl(userData.profile_picture);
                }
            } catch (err) {
                console.error('Failed to fetch user data', err);
                setError('Failed to load profile data');
            } finally {
                setFetchingData(false);
            }
        };

        fetchUserData();
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfilePicture(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            // Update profile data
            const social_links = {
                instagram: formData.instagram,
                twitter: formData.twitter,
                website: formData.website,
            };

            await api.patch('/api/users/me/', {
                bio: formData.bio,
                social_links,
            });

            // Upload profile picture if changed
            if (profilePicture) {
                const imageData = new FormData();
                imageData.append('profile_picture', profilePicture);
                await api.patch('/api/users/me/', imageData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

            setSuccess(true);
            setTimeout(() => {
                const username = localStorage.getItem('username');
                router.push(`/profile/${username}`);
            }, 1500);
        } catch (err: any) {
            console.error('Profile update error:', err.response?.status, err.response?.data, err);
            const data = err.response?.data;
            const detail = data?.detail
                || (typeof data === 'object' && data !== null ? Object.values(data).flat().join(', ') : null)
                || 'Failed to update profile';
            setError(detail);
        } finally {
            setLoading(false);
        }
    };

    if (fetchingData) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center pt-20">
                <div className="text-base-02">Loading profile...</div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-background pt-24 pb-12 px-4">
            <div className="container mx-auto max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-3xl p-8 shadow-sm"
                >
                    <h1 className="text-3xl font-bold text-base-03 mb-2">Edit Profile</h1>
                    <p className="text-base-02 mb-8">Update your profile information</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Profile Picture */}
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full bg-base-2 border-4 border-border overflow-hidden">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-base-01">
                                            <Camera className="w-12 h-12" />
                                        </div>
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                                    <Camera className="w-5 h-5" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            <p className="text-sm text-base-02 mt-2">Click camera to upload new photo</p>
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block text-sm font-medium text-base-03 mb-2">
                                Bio
                            </label>
                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base-03 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                placeholder="Tell us about yourself..."
                            />
                        </div>

                        {/* Social Links */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-base-03">Social Links</h3>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-base-03 mb-2">
                                    <Instagram className="w-4 h-4" />
                                    Instagram
                                </label>
                                <input
                                    type="text"
                                    value={formData.instagram}
                                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base-03 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                    placeholder="@username"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-base-03 mb-2">
                                    <Twitter className="w-4 h-4" />
                                    Twitter
                                </label>
                                <input
                                    type="text"
                                    value={formData.twitter}
                                    onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base-03 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                    placeholder="@username"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-base-03 mb-2">
                                    <Globe className="w-4 h-4" />
                                    Website
                                </label>
                                <input
                                    type="url"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base-03 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                    placeholder="https://yourwebsite.com"
                                />
                            </div>
                        </div>

                        {/* Error/Success Messages */}
                        {error && (
                            <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-success">
                                Profile updated successfully! Redirecting...
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 px-6 py-3 rounded-full border border-border text-base-03 hover:bg-base-2 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-6 py-3 rounded-full bg-base-03 text-white font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Save className="w-5 h-5" />
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </main>
    );
}
