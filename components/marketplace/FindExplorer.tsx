"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { browseListings, defaultFilters } from "@/lib/listings/browse";
import { emptyFavorites, readFavorites, subscribeStore } from "@/lib/browser-store";
import { NEIGHBORHOODS, type BrowseFilters } from "@/types/marketplace";

export function FindExplorer({ initial }: { initial: BrowseFilters }) {
  const router = useRouter();
  const [filters, setFilters] = useState(initial);
  const saved = useSyncExternalStore(subscribeStore, readFavorites, emptyFavorites);

  function update(partial: Partial<BrowseFilters>) {
    const next = { ...filters, ...partial };
    setFilters(next);
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.category !== "all") params.set("category", next.category);
    if (next.neighborhood !== "all") params.set("neighborhood", next.neighborhood);
    if (next.maxPrice) params.set("max", String(next.maxPrice));
    if (next.availability !== "any") params.set("when", next.availability);
    if (next.sort !== "featured") params.set("sort", next.sort);
    if (next.savedOnly) params.set("saved", "1");
    if (next.minCubic) params.set("space", String(next.minCubic));
    if (next.access !== "any") params.set("access", next.access);
    if (next.vehicle !== "any") params.set("vehicle", next.vehicle);
    if (next.covered) params.set("covered", "1");
    if (next.overnight) params.set("overnight", "1");
    if (next.inAndOut) params.set("inout", "1");
    if (next.event !== "any") params.set("event", next.event);
    const query = params.toString();
    router.replace(query ? `/find?${query}` : "/find", { scroll: false });
  }

  const results = browseListings(filters, saved);

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[280px_1fr]">
      <form className="h-fit space-y-5 rounded-3xl border border-line bg-paper p-5" aria-label="Filter listings" onSubmit={(event) => event.preventDefault()}>
        <div>
          <label htmlFor="search" className="text-sm text-forest">Search</label>
          <input
            id="search"
            value={filters.q}
            onChange={(event) => update({ q: event.target.value })}
            placeholder="Closet, driveway, East Rock"
            className="mt-2 w-full rounded-2xl border border-line bg-cream px-3 py-2.5"
          />
        </div>
        <fieldset>
          <legend className="text-sm text-forest">Category</legend>
          <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
            {(["all", "storage", "parking"] as const).map((category) => (
              <button
                key={category}
                type="button"
                aria-pressed={filters.category === category}
                onClick={() => update({ category })}
                className={`rounded-full border px-2 py-2 capitalize ${filters.category === category ? "border-forest bg-forest text-cream" : "border-line"}`}
              >
                {category}
              </button>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="neighborhood" className="text-sm text-forest">Neighborhood</label>
          <select
            id="neighborhood"
            value={filters.neighborhood}
            onChange={(event) => update({ neighborhood: event.target.value as BrowseFilters["neighborhood"] })}
            className="mt-2 w-full rounded-2xl border border-line bg-cream px-3 py-2.5"
          >
            <option value="all">All neighborhoods</option>
            {NEIGHBORHOODS.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="max" className="text-sm text-forest">Maximum listed rate</label>
          <input
            id="max"
            type="number"
            min={0}
            inputMode="numeric"
            value={filters.maxPrice ?? ""}
            onChange={(event) => update({ maxPrice: event.target.value ? Number(event.target.value) : null })}
            placeholder="Any"
            className="mt-2 w-full rounded-2xl border border-line bg-cream px-3 py-2.5"
          />
          <p className="mt-2 text-xs leading-5 text-muted">Compares the number on the card. Hourly, daily, event, and monthly rates are not converted here. SpaceMatch compares the full stay.</p>
        </div>
        <div>
          <label htmlFor="when" className="text-sm text-forest">Availability</label>
          <select
            id="when"
            value={filters.availability}
            onChange={(event) => update({ availability: event.target.value as BrowseFilters["availability"] })}
            className="mt-2 w-full rounded-2xl border border-line bg-cream px-3 py-2.5"
          >
            <option value="any">Any demo window</option>
            <option value="summer-2027">Summer 2027</option>
            <option value="graduation-demo">May 22–24, 2027 demo</option>
            <option value="fall-2027">Fall 2027</option>
          </select>
        </div>
        {filters.category !== "parking" ? (
          <>
            <div>
              <label htmlFor="space" className="text-sm text-forest">Storage capacity</label>
              <select
                id="space"
                value={filters.minCubic ?? ""}
                onChange={(event) => update({ minCubic: event.target.value ? Number(event.target.value) : null })}
                className="mt-2 w-full rounded-2xl border border-line bg-cream px-3 py-2.5"
              >
                <option value="">Any size</option>
                <option value="50">At least 50 cubic feet</option>
                <option value="100">At least 100 cubic feet</option>
                <option value="200">At least 200 cubic feet</option>
              </select>
            </div>
            <div>
              <label htmlFor="access" className="text-sm text-forest">Access</label>
              <select
                id="access"
                value={filters.access}
                onChange={(event) => update({ access: event.target.value as BrowseFilters["access"] })}
                className="mt-2 w-full rounded-2xl border border-line bg-cream px-3 py-2.5"
              >
                <option value="any">Any access</option>
                <option value="weekend">Weekends or flexible</option>
                <option value="flexible">Flexible access</option>
              </select>
            </div>
          </>
        ) : null}
        {filters.category !== "storage" ? (
          <fieldset className="space-y-2 text-sm">
            <legend className="text-sm text-forest">Parking</legend>
            <label className="mt-2 block">
              Vehicle
              <select
                value={filters.vehicle}
                onChange={(event) => update({ vehicle: event.target.value as BrowseFilters["vehicle"] })}
                className="mt-1 w-full rounded-2xl border border-line bg-cream px-3 py-2.5"
              >
                <option value="any">Any size</option>
                <option value="sedan">Sedan or larger spot</option>
                <option value="suv">SUV-capable</option>
              </select>
            </label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={filters.overnight} onChange={(event) => update({ overnight: event.target.checked })} /> Overnight</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={filters.inAndOut} onChange={(event) => update({ inAndOut: event.target.checked })} /> In-and-out access</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={filters.covered} onChange={(event) => update({ covered: event.target.checked })} /> Covered</label>
            <label className="block">
              Event
              <select
                value={filters.event}
                onChange={(event) => update({ event: event.target.value as BrowseFilters["event"] })}
                className="mt-1 w-full rounded-2xl border border-line bg-cream px-3 py-2.5"
              >
                <option value="any">Any</option>
                <option value="graduation">Graduation window</option>
                <option value="game-day">Game-day window</option>
              </select>
            </label>
          </fieldset>
        ) : null}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={filters.savedOnly} onChange={(event) => update({ savedOnly: event.target.checked })} />
          Saved in this browser
        </label>
        <button type="button" onClick={() => update(defaultFilters)} className="text-sm text-forest underline underline-offset-4">
          Clear filters
        </button>
      </form>
      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="display text-4xl text-forest">Find space</h1>
            <p className="mt-2 text-muted">{results.length} fictional listing{results.length === 1 ? "" : "s"}</p>
          </div>
          <label className="text-sm text-forest">
            Sort
            <select
              value={filters.sort}
              onChange={(event) => update({ sort: event.target.value as BrowseFilters["sort"] })}
              className="ml-2 rounded-full border border-line bg-paper px-3 py-2"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Rate, low to high</option>
              <option value="price-desc">Rate, high to low</option>
              <option value="neighborhood">Neighborhood</option>
            </select>
          </label>
        </div>
        {results.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line bg-paper px-6 py-16 text-center">
            <p className="display text-3xl text-forest">Nothing fits those filters</p>
            <p className="mx-auto mt-3 max-w-md text-muted">Try a wider neighborhood, or describe the stay in SpaceMatch and let Grok sort the constraints.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {results.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
