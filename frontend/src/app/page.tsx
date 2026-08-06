'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Feed from "@/components/Feed";
import AdvancedFilters, { FilterState } from "@/components/AdvancedFilters";
import WaveGallery from "@/components/WaveGallery";
import { PageShell } from "@/components/layout/page-shell";

function HomeContent() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<FilterState>({
    minPrice: null,
    maxPrice: null,
    sizes: [],
    condition: null,
    ordering: '-created_at',
  });


  // Build filter object for Feed. Memoized so it's referentially stable — Feed
  // refetches on every change to this object, and a fresh literal each render
  // would loop.
  const search = searchParams.get('search') || undefined;
  const drop = searchParams.get('drop') || undefined;
  const feedFilters = useMemo(() => ({
    search,
    drop,
    min_price: filters.minPrice || undefined,
    max_price: filters.maxPrice || undefined,
    size: filters.sizes.length > 0 ? filters.sizes.join(',') : undefined,
    condition: filters.condition || undefined,
    ordering: filters.ordering,
  }), [search, drop, filters]);

  return (
    <PageShell maxWidth="full" noPadding className="selection:bg-primary/20">
      {/* Hero — typographic, no photo. The old hero used a Studio Ghibli
          still as a decorative wash (off-brand and copyrighted on a public
          site); with no reliable product photography to replace it with,
          the type itself carries the section instead. */}
      <div className="relative overflow-hidden py-32 sm:py-40">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-6xl font-semibold tracking-tight text-foreground sm:text-8xl lg:text-9xl">
            Future of Thrifting.
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-muted-foreground">
            Discover curated vintage and pre-loved fashion in a premium marketplace
            built for sustainable style.
          </p>

          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a href="#feed" className="rounded-full bg-ink px-8 py-3 text-sm font-semibold text-white shadow-md transition-all hover:scale-105 hover:bg-ink/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
              Explore Feed
            </a>
            <a href="/sell" className="text-sm font-semibold leading-6 text-foreground transition-colors hover:text-muted-foreground">
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
          <h2 className="font-display mb-6 text-2xl font-semibold tracking-tight text-foreground">
            {searchParams.get('search') ? `Results for "${searchParams.get('search')}"` : 'Trending Now'}
          </h2>

          <AdvancedFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        <Feed filters={feedFilters} />
      </div>
    </PageShell>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background"><div className="text-muted-foreground">Loading...</div></div>}>
      <HomeContent />
    </Suspense>
  );
}
