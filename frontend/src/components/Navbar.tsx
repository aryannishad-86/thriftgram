'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

import NavLinks from './NavLinks';
import SearchBar from './SearchBar';
import NavActions from './NavActions';

export default function Navbar() {
    const [username, setUsername] = useState<string | null>(null);

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            setUsername(storedUsername);
        }
    }, []);

    const pathname = usePathname();
    const isAuthPage = pathname === '/login' || pathname === '/register';

    if (isAuthPage) {
        return (
            <nav className="absolute top-0 z-50 w-full p-8 lg:p-16">
                <Link href="/" className="font-display text-3xl font-semibold text-ink transition-colors hover:text-ink/70 lg:text-4xl">
                    ThriftGram
                </Link>
            </nav>
        );
    }

    // Flat solid surface, not glass — nothing in this app scrolls behind a
    // transparent sticky nav, so per the surgical-glass rule this stays flat.
    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95">
            <div className="container relative mx-auto grid h-[72px] grid-cols-[1fr_auto_1fr] items-center px-4">
                <div className="flex justify-start">
                    <Link href="/" className="font-display text-2xl font-semibold text-ink transition-colors hover:text-ink/70">
                        ThriftGram
                    </Link>
                </div>

                <div className="flex items-center justify-center gap-8">
                    <NavLinks />
                </div>

                <div className="z-10 flex items-center justify-end gap-3">
                    <SearchBar />
                    <NavActions username={username} />
                </div>
            </div>
        </nav>
    );
}
