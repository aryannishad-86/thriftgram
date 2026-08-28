'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
      {/* Hero — broken 12-col grid, not a centered block. A magazine cover
          doesn't center its masthead; it lets the headline run to one edge
          and holds the rest as deliberate negative space. The old hero
          centered everything (text-center, mx-auto max-w-2xl) — the single
          most "generic SaaS landing page" tell in the whole app. */}
      <div className="relative overflow-hidden px-6 pb-20 pt-28 sm:px-10 lg:pb-28 lg:pt-36">
        <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-4">
          {/* Vertical index rail — pure editorial furniture, desktop only.
              This is the wall-label voice applied to the page itself, not
              just its buttons. */}
          <div className="hidden lg:col-span-1 lg:flex lg:items-end lg:justify-start">
            <span className="label-meta origin-bottom-left -rotate-90 whitespace-nowrap text-muted">
              Vol. 01 — After Hours
            </span>
          </div>

          <div className="lg:col-start-2 lg:col-span-7">
            <p className="label-meta mb-6 text-primary">
              Est. Now — Resale Marketplace
            </p>
            <h1 className="font-display text-display leading-[0.88] text-foreground">
              Future of
              <br />
              Thrifting.
            </h1>
          </div>

          {/* Narrow subhead column, bottom-aligned and offset a full column
              from the headline (the gap at col 9 is deliberate) — the
              asymmetry IS the layout, not a responsive accident. */}
          <div className="flex flex-col justify-end gap-8 lg:col-start-10 lg:col-span-3">
            <p className="text-lg leading-8 text-muted-foreground">
              Curated vintage and pre-loved fashion, for people who&rsquo;d
              rather find something than shop for it.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Button asChild size="lg">
                <a href="#feed">Explore Feed</a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="/sell">
                  Start Selling <span aria-hidden="true">→</span>
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Separator className="mx-6 sm:mx-10" />

      {/* WaveGallery Section — CSS 3D for now; the three.js signature-moment
          rebuild is R5, a deliberately separate phase (WebGL is scoped to
          two moments only, this is the first, and it deserves its own
          reviewable diff rather than arriving as a drive-by inside R3). */}
      <WaveGallery />

      <Separator className="mx-6 sm:mx-10" />

      {/* Feed Section */}
      <div id="feed" className="container mx-auto px-6 py-16 sm:px-10">
        <div className="mb-10 flex items-baseline justify-between gap-4">
          <div>
            <p className="label-meta mb-3 text-muted">
              {searchParams.get('search') ? 'Search Results' : 'The Rack'}
            </p>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              {searchParams.get('search') ? `"${searchParams.get('search')}"` : 'Trending Now'}
            </h2>
          </div>
        </div>

        <AdvancedFilters filters={filters} onFiltersChange={setFilters} />
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
