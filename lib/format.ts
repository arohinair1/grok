import type { Listing, PricingUnit } from "@/types/marketplace";

const unitWord: Record<PricingUnit, string> = {
  hour: "hour",
  day: "day",
  month: "month",
  event: "event",
};

export function money(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function priceLabel(listing: Pick<Listing, "price" | "pricingUnit">) {
  return `${money(listing.price)}/${unitWord[listing.pricingUnit]}`;
}

export function formatDate(iso: string | null) {
  if (!iso) return "Date needed";
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
