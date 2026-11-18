export const NEIGHBORHOODS = [
  "Old Campus",
  "Broadway",
  "Science Hill",
  "Dwight",
  "East Rock",
  "Downtown New Haven",
  "Yale Bowl",
] as const;

export type Neighborhood = (typeof NEIGHBORHOODS)[number];

export type Category = "storage" | "parking";

export type PricingUnit = "hour" | "day" | "month" | "event";

export type VehicleSize = "compact" | "sedan" | "suv" | "oversized";

export type AccessFrequency = "flexible" | "weekend" | "appointment" | "weekday";

export type Listing = {
  id: string;
  title: string;
  category: Category;
  neighborhood: Neighborhood;
  areaNote: string;
  price: number;
  pricingUnit: PricingUnit;
  description: string;
  capacityLabel: string;
  amenities: string[];
  accessHours: string;
  accessWindow: { start: string; end: string } | null;
  availability: {
    start: string;
    end: string;
    notes: string;
  };
  image: string;
  imageAlt: string;
  hostLabel: string;
  restrictions: string[];
  featured?: boolean;
  cubicFeet?: number;
  allowedItems?: string[];
  restrictedItems?: string[];
  climate?: string;
  accessFrequency?: AccessFrequency;
  minMonths?: number;
  vehicleSizeLimit?: VehicleSize;
  spotType?: string;
  covered?: boolean;
  overnight?: boolean;
  inAndOut?: boolean;
  eventTags?: Array<"graduation" | "game-day" | "move-in" | "move-out" | "campus-event">;
  minHours?: number;
  walkingNote?: string;
};

export type BrowseFilters = {
  q: string;
  category: "all" | Category;
  neighborhood: "all" | Neighborhood;
  maxPrice: number | null;
  availability: "any" | "summer-2027" | "graduation-demo" | "fall-2027";
  sort: "featured" | "price-asc" | "price-desc" | "neighborhood";
  minCubic: number | null;
  access: "any" | "weekend" | "flexible";
  vehicle: "any" | "sedan" | "suv";
  covered: boolean;
  overnight: boolean;
  inAndOut: boolean;
  event: "any" | "graduation" | "game-day";
  savedOnly: boolean;
};
