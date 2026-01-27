'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Feed from "@/components/Feed";
import AdvancedFilters, { FilterState } from "@/components/AdvancedFilters";
import WaveGallery from "@/components/WaveGallery";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<FilterState>({
    minPrice: null,
    maxPrice: null,
    sizes: [],
    condition: null,
    ordering: '-created_at',
  });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Build filter object for Feed component
  const feedFilters = {
    search: searchParams.get('search') || undefined,
    min_price: filters.minPrice || undefined,
    max_price: filters.maxPrice || undefined,
    size: filters.sizes.length > 0 ? filters.sizes.join(',') : undefined,
    condition: filters.condition || undefined,
    ordering: filters.ordering,
  };

  return (
    <main className="min-h-screen bg-background selection:bg-primary/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-24 sm:py-32 isolate">
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
            <a href="#feed" className="rounded-full bg-base-03 px-8 py-3 text-sm font-semibold text-white shadow-md hover:bg-base-03/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-base-03 transition-all hover:scale-105">
              Explore Feed
            </a>
            <a href="/sell" className="text-sm font-semibold leading-6 text-base-03 hover:text-base-03 transition-colors">
              Start Selling <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>

      {/* WaveGallery Section */}
      <WaveGallery />

      {/* Feed Section */}
      <div id="feed" className="container mx-auto px-4 py-16">
        <div className="mb-10">
          <h2 className="text-2xl font-bold tracking-tight text-base-03 mb-6">
            {searchParams.get('search') ? `Results for "${searchParams.get('search')}"` : 'Trending Now'}
          </h2>

          {/* Advanced Filters */}
          <AdvancedFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        <Feed filters={feedFilters} />
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-base-02">Loading...</div></div>}>
      <HomeContent />
    </Suspense>
  );
}
