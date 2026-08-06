'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/field';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { PageShell } from '@/components/layout/page-shell';

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
            const social_links = {
                instagram: formData.instagram,
                twitter: formData.twitter,
                website: formData.website,
            };

            await api.patch('/api/users/me/', { bio: formData.bio, social_links });

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
            <div className="flex min-h-screen items-center justify-center bg-background pt-20">
                <div className="text-muted-foreground">Loading profile...</div>
            </div>
        );
    }

    return (
        <PageShell maxWidth="2xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card padding="lg" className="shadow-sm">
                    <h1 className="font-display mb-2 text-3xl font-semibold text-foreground">Edit Profile</h1>
                    <p className="mb-8 text-muted-foreground">Update your profile information</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-border bg-base-2">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-muted">
                                            <Camera className="h-12 w-12" />
                                        </div>
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-primary p-2 text-primary-foreground transition-colors hover:bg-primary-hover">
                                    <Camera className="h-5 w-5" />
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                </label>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">Click camera to upload new photo</p>
                        </div>

                        <Field label="Bio">
                            <Textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                rows={4}
                                placeholder="Tell us about yourself..."
                            />
                        </Field>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-foreground">Social Links</h3>

                            <Field label="Instagram">
                                <Input
                                    value={formData.instagram}
                                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                    placeholder="@username"
                                />
                            </Field>

                            <Field label="Twitter">
                                <Input
                                    value={formData.twitter}
                                    onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                                    placeholder="@username"
                                />
                            </Field>

                            <Field label="Website">
                                <Input
                                    type="url"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    placeholder="https://yourwebsite.com"
                                />
                            </Field>
                        </div>

                        {error && <Alert variant="error">{error}</Alert>}
                        {success && <Alert variant="success">Profile updated successfully! Redirecting...</Alert>}

                        <div className="flex gap-4">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading} loading={loading} className="flex-1">
                                {!loading && <Save className="h-5 w-5" />}
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </motion.div>
        </PageShell>
    );
}
