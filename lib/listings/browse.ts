import { listings } from "@/data/listings";
import { covers } from "@/lib/matching/dates";
import type { BrowseFilters, Listing, VehicleSize } from "@/types/marketplace";

const WINDOWS = {
  "summer-2027": ["2027-05-15", "2027-08-20"],
  "graduation-demo": ["2027-05-22", "2027-05-24"],
  "fall-2027": ["2027-09-01", "2027-12-15"],
} as const;

const SIZE_RANK: Record<VehicleSize, number> = {
  compact: 1,
  sedan: 2,
  suv: 3,
  oversized: 4,
};

export const defaultFilters: BrowseFilters = {
  q: "",
  category: "all",
  neighborhood: "all",
  maxPrice: null,
  availability: "any",
  sort: "featured",
  minCubic: null,
  access: "any",
  vehicle: "any",
  covered: false,
  overnight: false,
  inAndOut: false,
  event: "any",
  savedOnly: false,
};

export function browseListings(filters: BrowseFilters, savedIds: string[] = [], source: Listing[] = listings) {
  const query = filters.q.trim().toLowerCase();
  const results = source.filter((listing) => {
    if (filters.savedOnly && !savedIds.includes(listing.id)) return false;
    if (filters.category !== "all" && listing.category !== filters.category) return false;
    if (filters.neighborhood !== "all" && listing.neighborhood !== filters.neighborhood) return false;
    if (filters.maxPrice != null && listing.price > filters.maxPrice) return false;
    if (filters.availability !== "any") {
      const [start, end] = WINDOWS[filters.availability];
      if (!covers(listing.availability.start, listing.availability.end, start, end)) return false;
    }
    if (query) {
      const haystack = [listing.title, listing.neighborhood, listing.description, listing.areaNote, listing.category]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (listing.category === "storage") {
      if (filters.minCubic && (listing.cubicFeet ?? 0) < filters.minCubic) return false;
      if (filters.access === "weekend" && listing.accessFrequency !== "weekend" && listing.accessFrequency !== "flexible") {
        return false;
      }
      if (filters.access === "flexible" && listing.accessFrequency !== "flexible") return false;
    }
    if (listing.category === "parking") {
      if (filters.vehicle !== "any" && listing.vehicleSizeLimit) {
        if (SIZE_RANK[listing.vehicleSizeLimit] < SIZE_RANK[filters.vehicle]) return false;
      }
      if (filters.covered && !listing.covered) return false;
      if (filters.overnight && !listing.overnight) return false;
      if (filters.inAndOut && !listing.inAndOut) return false;
      if (filters.event !== "any" && !listing.eventTags?.includes(filters.event)) return false;
    }
    return true;
  });

  const sorted = [...results];
  if (filters.sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
  else if (filters.sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
  else if (filters.sort === "neighborhood") sorted.sort((a, b) => a.neighborhood.localeCompare(b.neighborhood));
  else sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || a.title.localeCompare(b.title));
  return sorted;
}
