import type { Listing } from "@/types/marketplace";
import type { Quote, SpaceRequest } from "@/types/match";
import { billedMonths, hoursBetween, inclusiveDays } from "@/lib/matching/dates";

export type StayInput = {
  startDate: string | null;
  endDate: string | null;
  arrivalTime: string | null;
  departureTime: string | null;
};

export function quoteListing(listing: Listing, stay: StayInput): Quote | null {
  const start = stay.startDate;
  const end = stay.endDate ?? stay.startDate;
  if (listing.pricingUnit === "hour") {
    if (!start || !end || !stay.arrivalTime || !stay.departureTime) return null;
    const rawHours = hoursBetween(start, end, stay.arrivalTime, stay.departureTime);
    if (!rawHours) return null;
    const minimum = listing.minHours ?? 1;
    const hours = Math.max(minimum, rawHours);
    return {
      amount: hours * listing.price,
      hours,
      days: inclusiveDays(start, end),
      months: null,
      quantityLabel: `${hours} hour${hours === 1 ? "" : "s"} × $${listing.price}`,
      assumption:
        hours > rawHours
          ? `This listing has a ${minimum}-hour minimum, so the estimate uses ${hours} hours.`
          : "Hourly total from the arrival and departure times you entered.",
    };
  }

  if (listing.pricingUnit === "event") {
    return {
      amount: listing.price,
      hours: null,
      days: start && end ? inclusiveDays(start, end) : null,
      months: null,
      quantityLabel: `Flat event price`,
      assumption: "One flat event price for a stay inside this listing's demo window. It is not a per-day rate.",
    };
  }

  if (listing.pricingUnit === "day") {
    if (!start || !end) return null;
    const days = inclusiveDays(start, end);
    if (!days) return null;
    return {
      amount: days * listing.price,
      hours: null,
      days,
      months: null,
      quantityLabel: `${days} day${days === 1 ? "" : "s"} × $${listing.price}`,
      assumption: "Each calendar day counts, including partial days.",
    };
  }

  if (!start || !end) {
    return {
      amount: listing.price,
      hours: null,
      days: null,
      months: 1,
      quantityLabel: `1 month × $${listing.price}`,
      assumption: listing.minMonths && listing.minMonths > 1
        ? `Without dates, this shows one month. The listing minimum is ${listing.minMonths} months.`
        : "Without a full date range, this shows a single month.",
    };
  }
  const months = Math.max(listing.minMonths ?? 1, billedMonths(start, end) ?? 1);
  return {
    amount: months * listing.price,
    hours: null,
    days: inclusiveDays(start, end),
    months,
    quantityLabel: `${months} month${months === 1 ? "" : "s"} × $${listing.price}`,
    assumption:
      listing.category === "parking"
        ? "A monthly listing is billed in whole months. A shorter stay still pays the monthly rate."
        : "Storage is estimated with 30-day months, rounded to the nearest month, and never below the listing minimum.",
  };
}

export function comparablePrice(listing: Listing, request: SpaceRequest, quote: Quote | null) {
  const unit = request.budgetUnit;
  if (unit === "month") {
    if (listing.pricingUnit === "month") return listing.price;
    if (quote?.months) return quote.amount / quote.months;
    return null;
  }
  if (unit === "day") {
    if (listing.pricingUnit === "day") return listing.price;
    if (quote?.days) return quote.amount / quote.days;
    if (listing.pricingUnit === "event") return listing.price;
    return null;
  }
  if (unit === "hour") {
    if (listing.pricingUnit === "hour") return listing.price;
    return null;
  }
  if (unit === "total" || unit === "event") {
    if (quote) return quote.amount;
    if (listing.pricingUnit === "event") return listing.price;
    return null;
  }
  if (request.category === "storage" && listing.pricingUnit === "month") return listing.price;
  return quote?.amount ?? null;
}

export function bookingBlockers(listing: Listing, stay: StayInput) {
  const reasons: string[] = [];
  if (!stay.startDate || !stay.endDate) {
    reasons.push("Choose a start and end date.");
    return reasons;
  }
  if (stay.endDate < stay.startDate) {
    reasons.push("The end date is before the start date.");
    return reasons;
  }
  if (listing.availability.start > stay.startDate || listing.availability.end < stay.endDate) {
    reasons.push(
      `This demo listing is only marked available from ${listing.availability.start} through ${listing.availability.end}.`,
    );
  }
  const spansNight = stay.endDate > stay.startDate;
  if (listing.category === "parking" && spansNight && listing.overnight === false) {
    reasons.push("This spot does not allow overnight parking, and these dates span more than one day.");
  }
  if (listing.category === "parking" && listing.pricingUnit === "hour" && (!stay.arrivalTime || !stay.departureTime)) {
    reasons.push("Add arrival and departure times so the hourly total can be calculated.");
  }
  if (listing.accessWindow && stay.arrivalTime && stay.arrivalTime < listing.accessWindow.start) {
    reasons.push(`Arrival is before this listing opens at ${listing.accessWindow.start}.`);
  }
  if (listing.accessWindow && stay.departureTime && stay.departureTime > listing.accessWindow.end) {
    reasons.push(`Departure is after this listing closes at ${listing.accessWindow.end}.`);
  }
  return reasons;
}
