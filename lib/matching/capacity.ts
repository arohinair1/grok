import type { Listing, VehicleSize } from "@/types/marketplace";
import type { FitLevel, RequestedItem } from "@/types/match";

const ITEM_CUBIC: Array<{ test: RegExp; cubic: number }> = [
  { test: /mini-fridge|minifridge|refrigerator|fridge/, cubic: 8 },
  { test: /suitcase/, cubic: 4 },
  { test: /luggage/, cubic: 3 },
  { test: /box/, cubic: 2 },
  { test: /bicycle|bike/, cubic: 18 },
  { test: /furniture|desk|chair|dresser/, cubic: 25 },
];

const SIZE_RANK: Record<VehicleSize, number> = {
  compact: 1,
  sedan: 2,
  suv: 3,
  oversized: 4,
};

export function itemCubicFeet(item: RequestedItem) {
  const rule = ITEM_CUBIC.find((entry) => entry.test.test(item.name.toLowerCase()));
  return (rule?.cubic ?? 6) * item.quantity;
}

export function estimateCubicFeet(items: RequestedItem[]) {
  if (items.length === 0) return null;
  return items.reduce((sum, item) => sum + itemCubicFeet(item), 0);
}

export function capacityFit(listing: Listing, items: RequestedItem[], estimate: number | null): FitLevel {
  if (listing.category !== "storage") return "unknown";
  if (!listing.cubicFeet || estimate == null) return "unknown";
  if (estimate <= listing.cubicFeet * 0.8) return "likely";
  if (estimate <= listing.cubicFeet) return "possible";
  return "unlikely";
}

export function restrictionConflict(listing: Listing, items: RequestedItem[]) {
  const restricted = (listing.restrictedItems ?? []).join(" ").toLowerCase();
  if (!restricted) return null;
  for (const item of items) {
    const name = item.name.toLowerCase();
    if (/mini-fridge|minifridge|fridge|refrigerator|appliance/.test(name) && /appliance|mini-fridge|fridge|refrigerator/.test(restricted)) {
      return `${item.name} is not allowed`;
    }
    if (/bicycle|bike/.test(name) && /bicycle|bike/.test(restricted)) {
      return "a bicycle is not allowed";
    }
    if (/furniture|desk|chair|dresser/.test(name) && /furniture/.test(restricted)) {
      return "furniture is not allowed";
    }
  }
  return null;
}

export function vehicleFits(limit: VehicleSize | undefined, requested: VehicleSize | null) {
  if (!limit || !requested) return "unknown" as const;
  return SIZE_RANK[requested] <= SIZE_RANK[limit] ? ("fits" as const) : ("too-large" as const);
}
