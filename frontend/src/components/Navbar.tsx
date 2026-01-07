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
                <Link href="/" className="text-3xl lg:text-4xl font-bold tracking-tighter text-base-03 hover:text-base-02 transition-colors">
                    ThriftGram
                </Link>
            </nav>
        );
    }

    return (
        <nav className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur-md border-b border-border transition-all duration-300 shadow-sm">
            <div className="container mx-auto grid grid-cols-[1fr_auto_1fr] h-[72px] items-center px-4 relative">
                {/* Logo */}
                <div className="flex justify-start">
                    <Link href="/" className="text-2xl font-bold tracking-tighter text-primary hover:text-primary/80 transition-colors">
                        ThriftGram
                    </Link>
                </div>

                {/* Centered Nav Links */}
                <div className="flex justify-center items-center gap-8">
                    <NavLinks />
                </div>

                {/* Right Side: Search + Actions */}
                <div className="flex justify-end items-center gap-4 z-10">
                    <SearchBar />
                    <NavActions username={username} />
                </div>
            </div>
        </nav>
    );
}
