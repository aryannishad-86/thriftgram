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
            <nav className="absolute top-0 z-50 w-full p-6">
                <div className="container mx-auto">
                    <Link href="/" className="text-2xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent hover:opacity-80 transition-opacity">
                        ThriftGram
                    </Link>
                </div>
            </nav>
        );
    }

    return (
        <nav className="sticky top-0 z-50 w-full bg-black/35 backdrop-blur-[18px] supports-[backdrop-filter]:bg-black/35 transition-all duration-300">
            <div className="container mx-auto grid grid-cols-[1fr_auto_1fr] h-[72px] items-center px-4 relative">
                {/* Logo */}
                <div className="flex justify-start">
                    <Link href="/" className="text-2xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent hover:opacity-80 transition-opacity hover:drop-shadow-[0_0_15px_rgba(109,40,217,0.5)] z-10">
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
            {/* Dark Mode Gradient Line */}
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
        </nav>
    );
}
