'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RegisterPage() {
    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-secondary/30 px-4">
            <div className="w-full max-w-md space-y-8 rounded-xl border border-secondary bg-background p-8 shadow-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Create an account</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Join the community to buy and sell
                    </p>
                </div>

                <div className="mt-8 space-y-6">
                    <p className="text-center text-muted-foreground">
                        Registration is currently invite-only or handled via admin.
                        <br />
                        Please contact support or use the demo account.
                    </p>

                    <div className="text-center">
                        <Link href="/login">
                            <Button variant="outline" className="w-full">
                                Back to Login
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
