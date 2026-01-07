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

  return (
    <main className="min-h-screen bg-background selection:bg-primary/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-border py-24 sm:py-32 isolate">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-bg.jpeg"
            alt="Background"
            className="h-full w-full object-cover object-[center_70%] opacity-20"
          />
        </div>

        {/* Subtle Overlay */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-base-3/80 via-base-3/60 to-base-3" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-5xl font-bold tracking-tight text-base-03 sm:text-7xl">
            Future of Thrifting.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-base-02">
            Discover curated vintage and pre-loved fashion in a premium, immersive marketplace.
            Sustainable style meets digital art.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a href="#feed" className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white shadow-md hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all hover:scale-105">
              Explore Feed
            </a>
            <a href="/sell" className="text-sm font-semibold leading-6 text-base-03 hover:text-primary transition-colors">
              Start Selling <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>

      {/* Feed Section */}
      <div id="feed" className="container mx-auto px-4 py-16">
        <div className="mb-10 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-base-03">
            Trending Now
          </h2>
          <div className="flex gap-2">
            {['All', 'Vintage', 'Streetwear', 'Y2K'].map((filter) => (
              <button key={filter} className="rounded-full border border-border bg-background px-4 py-1 text-xs font-medium text-base-02 hover:bg-base-2 hover:text-base-03 transition-all">
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
