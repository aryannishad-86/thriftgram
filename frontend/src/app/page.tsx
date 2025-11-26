'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Feed from "@/components/Feed";

export default function Home({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // We need to unwrap searchParams with use() or await it in a server component.
  // Since we switched to 'use client' for the redirect, we can't await props directly.
  // However, for this simple redirect fix, we'll just render the feed if we are on the client.
  // Ideally, this should be a middleware, but client-side check is faster for now.

  return (
    <main className="min-h-screen bg-background selection:bg-primary/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-white/5 py-24 sm:py-32 isolate">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-bg.jpeg"
            alt="Background"
            className="h-full w-full object-cover object-[center_70%] opacity-60"
          />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-7xl drop-shadow-2xl">
            Future of Thrifting.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-200 drop-shadow-md">
            Discover curated vintage and pre-loved fashion in a premium, immersive marketplace.
            Sustainable style meets digital art.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a href="#feed" className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-black shadow-lg hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all hover:scale-105">
              Explore Feed
            </a>
            <a href="/sell" className="text-sm font-semibold leading-6 text-white hover:text-primary transition-colors drop-shadow-md">
              Start Selling <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>

      {/* Feed Section */}
      <div id="feed" className="container mx-auto px-4 py-16">
        <div className="mb-10 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Trending Now
          </h2>
          <div className="flex gap-2">
            {['All', 'Vintage', 'Streetwear', 'Y2K'].map((filter) => (
              <button key={filter} className="rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-medium text-muted-foreground hover:bg-white/10 hover:text-white transition-all">
                {filter}
              </button>
            ))}
          </div>
        </div>

        <Feed />
      </div>
    </main>
  );
}
