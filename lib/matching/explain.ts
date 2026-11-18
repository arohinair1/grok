import { money } from "@/lib/format";
import type { Scored } from "@/lib/matching/match";
import type { SpaceRequest } from "@/types/match";

export function explainMatch(scored: Scored, request: SpaceRequest) {
  const { listing, fits, estimate, label } = scored;
  const place = listing.neighborhood;
  const price = estimate
    ? `${money(estimate.amount)} estimated (${estimate.quantityLabel})`
    : `${money(listing.price)} per ${listing.pricingUnit}`;
  let because = "";
  if (listing.category === "storage") {
    const fit =
      fits.capacity === "likely"
        ? "the described items likely fit"
        : fits.capacity === "possible"
          ? "the described items might fit, with little room to spare"
          : "item dimensions were not specific enough for a firm fit";
    because = `${listing.title} is a ${label.toLowerCase()} because ${fit}, the illustrative price is ${price}, and it is in ${place}.`;
  } else {
    const vehicle = request.vehicleSize ? `a ${request.vehicleSize}` : "the vehicle you described";
    const stay = request.overnightRequired || (request.startDate && request.endDate && request.endDate > request.startDate)
      ? "It allows the overnight stay this request needs."
      : "The timing fits the access rules on the listing.";
    because = `${listing.title} is a ${label.toLowerCase()} for ${vehicle}. ${stay} The illustrative price is ${price}, in ${place}.`;
  }
  const tradeoff = scored.tradeoff ? ` ${scored.tradeoff}` : "";
  return `${because}${tradeoff}`.replace(/\s+/g, " ").trim();
}
