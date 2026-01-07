'use client';

import Link from 'next/link';

export default function NavLinks() {
    return (
        <>
            <Link href="/dashboard" className="relative group hidden md:block text-sm font-medium text-base-02 hover:text-primary transition-colors">
                <span>Dashboard</span>
                <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link href="/closet" className="relative group hidden md:block text-sm font-medium text-base-02 hover:text-primary transition-colors">
                <span>My Closet</span>
                <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link href="/drops" className="relative group hidden md:block text-sm font-medium text-base-02 hover:text-primary transition-colors">
                <span>Drops</span>
                <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
        </>
    );
}
