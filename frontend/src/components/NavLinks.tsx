import Link from 'next/link';

export default function NavLinks() {
    return (
        <>
            <Link href="/dashboard" className="hidden md:block text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Dashboard
            </Link>
            <Link href="/closet" className="hidden md:block text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                My Closet
            </Link>
            <Link href="/drops" className="hidden md:block text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Drops
            </Link>
        </>
    );
}
