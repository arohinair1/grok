import type { Category, Neighborhood, PricingUnit, VehicleSize } from "@/types/marketplace";

export type BudgetUnit = "hour" | "day" | "month" | "event" | "total";

export type EventType =
  | "graduation"
  | "move-in"
  | "move-out"
  | "game-day"
  | "campus-event"
  | "semester"
  | "visit"
  | "other";

export type RequestedItem = {
  name: string;
  quantity: number;
};

export type SpaceRequest = {
  category: Category | "unclear";
  startDate: string | null;
  endDate: string | null;
  arrivalTime: string | null;
  departureTime: string | null;
  budgetAmount: number | null;
  budgetUnit: BudgetUnit | null;
  budgetIsMaximum: boolean;
  preferredNeighborhood: Neighborhood | "any" | null;
  accessRequirements: string[];
  specialConstraints: string[];
  missingInformation: string[];
  items: RequestedItem[];
  capacityCubicFeetEstimate: number | null;
  storageDurationMonths: number | null;
  vehicleType: string | null;
  vehicleSize: VehicleSize | null;
  eventType: EventType | null;
  overnightRequired: boolean | null;
  inAndOutRequired: boolean | null;
  coveredPreferred: boolean | null;
  walkingPreference: string | null;
};

export type FitLevel = "likely" | "possible" | "unlikely" | "unknown";

export type FitSummary = {
  budget: "good" | "over" | "unknown";
  capacity: FitLevel;
  location: "preferred" | "nearby" | "farther" | "unspecified";
  availability: "fits" | "unknown";
  access: "fits" | "partial" | "unknown";
};

export type Quote = {
  amount: number;
  assumption: string;
  quantityLabel: string;
  days: number | null;
  months: number | null;
  hours: number | null;
};

export type Recommendation = {
  listingId: string;
  score: number;
  label: string;
  explanation: string;
  explanationSource: "grok" | "template";
  tradeoff: string;
  fits: FitSummary;
  estimate: Quote | null;
};

export type SpaceMatchResponse = {
  inference: "grok" | "fallback";
  model: string | null;
  notice: string | null;
  request: SpaceRequest;
  recommendations: Recommendation[];
  excluded: Array<{ id: string; title: string; reason: string }>;
  emptyReason: string | null;
};

export type HostDraft = {
  category: Category | "unclear";
  title: string;
  description: string;
  neighborhood: Neighborhood | null;
  price: number | null;
  pricingUnit: PricingUnit | null;
  missingQuestions: string[];
  restrictions: string[];
  notes: string[];
};

export type HostAssistResponse = {
  inference: "grok" | "fallback";
  model: string | null;
  notice: string | null;
  draft: HostDraft;
};

export function emptyRequest(): SpaceRequest {
  return {
    category: "unclear",
    startDate: null,
    endDate: null,
    arrivalTime: null,
    departureTime: null,
    budgetAmount: null,
    budgetUnit: null,
    budgetIsMaximum: false,
    preferredNeighborhood: null,
    accessRequirements: [],
    specialConstraints: [],
    missingInformation: [],
    items: [],
    capacityCubicFeetEstimate: null,
    storageDurationMonths: null,
    vehicleType: null,
    vehicleSize: null,
    eventType: null,
    overnightRequired: null,
    inAndOutRequired: null,
    coveredPreferred: null,
    walkingPreference: null,
  };
}
