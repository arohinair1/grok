import type { Metadata } from "next";
import { FindExplorer } from "@/components/marketplace/FindExplorer";
import { defaultFilters } from "@/lib/listings/browse";
import type { BrowseFilters } from "@/types/marketplace";
import { NEIGHBORHOODS } from "@/types/marketplace";

export const metadata: Metadata = { title: "Find Space" };

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FindPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const category = one(params.category);
  const neighborhood = one(params.neighborhood);
  const availability = one(params.when);
  const sort = one(params.sort);
  const access = one(params.access);
  const vehicle = one(params.vehicle);
  const event = one(params.event);
  const initial: BrowseFilters = {
    ...defaultFilters,
    q: one(params.q) ?? "",
    category: category === "storage" || category === "parking" ? category : "all",
    neighborhood: NEIGHBORHOODS.includes(neighborhood as (typeof NEIGHBORHOODS)[number])
      ? (neighborhood as BrowseFilters["neighborhood"])
      : "all",
    maxPrice: one(params.max) ? Number(one(params.max)) : null,
    availability:
      availability === "summer-2027" || availability === "graduation-demo" || availability === "fall-2027"
        ? availability
        : "any",
    sort: sort === "price-asc" || sort === "price-desc" || sort === "neighborhood" ? sort : "featured",
    minCubic: one(params.space) ? Number(one(params.space)) : null,
    access: access === "weekend" || access === "flexible" ? access : "any",
    vehicle: vehicle === "sedan" || vehicle === "suv" ? vehicle : "any",
    covered: one(params.covered) === "1",
    overnight: one(params.overnight) === "1",
    inAndOut: one(params.inout) === "1",
    event: event === "graduation" || event === "game-day" ? event : "any",
    savedOnly: one(params.saved) === "1",
  };

  return <FindExplorer key={JSON.stringify(initial)} initial={initial} />;
}
