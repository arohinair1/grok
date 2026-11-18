import { listings } from "@/data/listings";
import type { Listing, Neighborhood } from "@/types/marketplace";
import type { FitSummary, Quote, SpaceRequest } from "@/types/match";
import { covers } from "@/lib/matching/dates";
import { capacityFit, estimateCubicFeet, restrictionConflict, vehicleFits } from "@/lib/matching/capacity";
import { comparablePrice, quoteListing } from "@/lib/matching/quote";

const NEAR: Record<string, Neighborhood[]> = {
  "Old Campus": ["Broadway", "Downtown New Haven", "Dwight"],
  Broadway: ["Old Campus", "Downtown New Haven", "Dwight"],
  "Science Hill": ["East Rock", "Broadway"],
  Dwight: ["Old Campus", "Broadway", "Downtown New Haven"],
  "East Rock": ["Science Hill"],
  "Downtown New Haven": ["Old Campus", "Broadway", "Dwight"],
  "Yale Bowl": ["Dwight"],
};

export type Scored = {
  listing: Listing;
  score: number;
  label: string;
  fits: FitSummary;
  estimate: Quote | null;
  tradeoff: string;
};

export type MatchResult = {
  eligible: Scored[];
  excluded: Array<{ id: string; title: string; reason: string }>;
};

function locationFit(preferred: SpaceRequest["preferredNeighborhood"], neighborhood: Neighborhood): FitSummary["location"] {
  if (!preferred || preferred === "any") return "unspecified";
  if (preferred === neighborhood) return "preferred";
  if (NEAR[preferred]?.includes(neighborhood)) return "nearby";
  return "farther";
}

function locationScore(fit: FitSummary["location"]) {
  if (fit === "preferred") return 100;
  if (fit === "nearby") return 78;
  if (fit === "unspecified") return 70;
  return 42;
}

function wantsWeekend(request: SpaceRequest) {
  return request.accessRequirements.some((item) => /weekend/i.test(item));
}

function budgetScore(listing: Listing, request: SpaceRequest, quote: Quote | null, comparable: number | null) {
  let score = 70;
  if (request.budgetAmount != null && comparable != null) {
    if (comparable <= request.budgetAmount) {
      const ratio = comparable / request.budgetAmount;
      score = 100 - (1 - ratio) * 8;
    } else {
      const over = (comparable - request.budgetAmount) / request.budgetAmount;
      score = over <= 0.15 ? 76 : over <= 0.35 ? 52 : 34;
    }
  }
  const days = quote?.days ?? null;
  if (days && listing.category === "parking" && listing.pricingUnit === "hour" && days > 1) score -= 40;
  if (days && listing.category === "parking" && listing.pricingUnit === "day" && days > 40) score -= 28;
  if (days && listing.category === "parking" && listing.pricingUnit === "month" && days < 10) score -= 24;
  return Math.max(0, Math.min(100, score));
}

function accessScore(listing: Listing, request: SpaceRequest) {
  let score = 82;
  if (wantsWeekend(request)) {
    score = listing.accessFrequency === "weekend" || listing.accessFrequency === "flexible" ? 94 : 48;
  }
  if (request.overnightRequired && listing.overnight) score = Math.max(score, 96);
  if (request.inAndOutRequired && listing.inAndOut) score = Math.max(score, 96);
  if (request.coveredPreferred && listing.covered === false) score = Math.min(score, 60);
  if (request.coveredPreferred && listing.covered) score = Math.max(score, 94);
  return score;
}

function tradeoffFor(listing: Listing, request: SpaceRequest, fits: FitSummary, quote: Quote | null) {
  const notes: string[] = [];
  if (fits.location === "farther" && request.preferredNeighborhood && request.preferredNeighborhood !== "any") {
    notes.push(`It is farther from ${request.preferredNeighborhood} than you asked for.`);
  } else if (fits.location === "nearby" && request.preferredNeighborhood && request.preferredNeighborhood !== "any") {
    notes.push(`It is near ${request.preferredNeighborhood}, not in that exact area.`);
  }
  if (fits.budget === "over") notes.push("The price is above the budget you named.");
  if (quote && listing.pricingUnit === "day" && (quote.days ?? 0) > 40) {
    notes.push("A daily rate becomes expensive across this many days.");
  }
  if (quote && listing.pricingUnit === "month" && (quote.days ?? 99) < 10) {
    notes.push("A short stay is still billed as a full month.");
  }
  if (fits.access === "partial") notes.push("Access is more limited than you described.");
  if (listing.pricingUnit === "hour") notes.push("The rate is hourly, so a long stay adds up quickly.");
  return notes[0] ?? "";
}

function labelFor(score: number) {
  if (score >= 85) return "Strong match";
  if (score >= 72) return "Good match";
  return "Possible match";
}

export function matchListings(request: SpaceRequest, source: Listing[] = listings): MatchResult {
  const excluded: MatchResult["excluded"] = [];
  const eligible: Scored[] = [];
  if (request.category === "unclear") {
    return { eligible: [], excluded: [] };
  }

  const cubic = request.category === "storage" ? estimateCubicFeet(request.items) : null;
  const spansNight = Boolean(request.startDate && request.endDate && request.endDate > request.startDate);
  const overnight = request.overnightRequired === true || (request.overnightRequired == null && spansNight);

  for (const listing of source) {
    if (listing.category !== request.category) continue;

    if (request.startDate && request.endDate) {
      if (!covers(listing.availability.start, listing.availability.end, request.startDate, request.endDate)) {
        excluded.push({
          id: listing.id,
          title: listing.title,
          reason: `It is not available for ${request.startDate} through ${request.endDate}.`,
        });
        continue;
      }
    }

    if (listing.category === "parking" && overnight && listing.overnight === false) {
      excluded.push({
        id: listing.id,
        title: listing.title,
        reason: "It does not allow overnight parking, and this stay goes past a single day or asks for overnight.",
      });
      continue;
    }

    if (request.inAndOutRequired && listing.inAndOut === false) {
      excluded.push({
        id: listing.id,
        title: listing.title,
        reason: "It does not allow in-and-out access.",
      });
      continue;
    }

    const vehicle = vehicleFits(listing.vehicleSizeLimit, request.vehicleSize);
    if (vehicle === "too-large") {
      excluded.push({
        id: listing.id,
        title: listing.title,
        reason: `It fits up to a ${listing.vehicleSizeLimit}, which is smaller than the vehicle described.`,
      });
      continue;
    }

    if (listing.accessWindow && request.arrivalTime && request.arrivalTime < listing.accessWindow.start) {
      excluded.push({
        id: listing.id,
        title: listing.title,
        reason: `Arrival is before the access window opens at ${listing.accessWindow.start}.`,
      });
      continue;
    }
    if (listing.accessWindow && request.departureTime && request.departureTime > listing.accessWindow.end) {
      excluded.push({
        id: listing.id,
        title: listing.title,
        reason: `Departure is after the access window closes at ${listing.accessWindow.end}.`,
      });
      continue;
    }

    const conflict = restrictionConflict(listing, request.items);
    if (conflict) {
      excluded.push({ id: listing.id, title: listing.title, reason: `Left out because ${conflict}.` });
      continue;
    }

    const fitLevel = capacityFit(listing, request.items, cubic);
    if (fitLevel === "unlikely") {
      excluded.push({
        id: listing.id,
        title: listing.title,
        reason: "The described items are unlikely to fit the listed dimensions.",
      });
      continue;
    }

    const estimate = quoteListing(listing, request);
    const comparable = comparablePrice(listing, request, estimate);
    if (
      request.budgetIsMaximum &&
      request.budgetAmount != null &&
      comparable != null &&
      comparable > request.budgetAmount
    ) {
      excluded.push({
        id: listing.id,
        title: listing.title,
        reason: "The price for this request is over the maximum budget.",
      });
      continue;
    }

    const location = locationFit(request.preferredNeighborhood, listing.neighborhood);
    const budgetFit: FitSummary["budget"] =
      request.budgetAmount == null || comparable == null ? "unknown" : comparable <= request.budgetAmount ? "good" : "over";
    const access: FitSummary["access"] =
      (request.coveredPreferred && listing.covered === false) || (wantsWeekend(request) && listing.accessFrequency === "appointment")
        ? "partial"
        : request.accessRequirements.length === 0 && request.coveredPreferred == null
          ? "unknown"
          : "fits";
    const fits: FitSummary = {
      budget: budgetFit,
      capacity: listing.category === "parking" ? (vehicle === "fits" ? "likely" : "unknown") : fitLevel,
      location,
      availability: request.startDate && request.endDate ? "fits" : "unknown",
      access,
    };

    const capacityScore = fits.capacity === "likely" ? 100 : fits.capacity === "possible" ? 74 : 64;
    const availabilityScore = fits.availability === "fits" ? 100 : 62;
    const parts =
      listing.category === "storage"
        ? [capacityScore, budgetScore(listing, request, estimate, comparable), locationScore(location), accessScore(listing, request), availabilityScore]
        : [availabilityScore, capacityScore, budgetScore(listing, request, estimate, comparable), locationScore(location), accessScore(listing, request)];
    const weights = listing.category === "storage" ? [0.28, 0.24, 0.24, 0.12, 0.12] : [0.2, 0.2, 0.24, 0.24, 0.12];
    let score = parts.reduce((sum, part, index) => sum + part * weights[index], 0);
    if (request.eventType && listing.eventTags?.some((tag) => tag === request.eventType)) score += 4;
    score = Math.round(Math.max(0, Math.min(100, score)));

    eligible.push({
      listing,
      score,
      label: labelFor(score),
      fits,
      estimate,
      tradeoff: tradeoffFor(listing, request, fits, estimate),
    });
  }

  eligible.sort((a, b) => b.score - a.score || a.listing.price - b.listing.price);
  return { eligible: eligible.slice(0, 4), excluded };
}
