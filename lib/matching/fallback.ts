import { findDates, sundayWithin } from "@/lib/matching/dates";
import { estimateCubicFeet } from "@/lib/matching/capacity";
import { NEIGHBORHOODS, type Neighborhood } from "@/types/marketplace";
import { emptyRequest, type RequestedItem, type SpaceRequest } from "@/types/match";

function addItem(items: RequestedItem[], name: string, quantity: number) {
  const existing = items.find((item) => item.name === name);
  if (existing) existing.quantity = Math.max(existing.quantity, quantity);
  else items.push({ name, quantity });
}

const NUMBER_WORDS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

function leadingQuantity(text: string, noun: string) {
  const match = text.match(new RegExp(`(\\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten)\\s+${noun}`, "i"));
  if (!match) return null;
  const raw = match[1].toLowerCase();
  return NUMBER_WORDS[raw] ?? Number(raw);
}

function parseItems(text: string) {
  const items: RequestedItem[] = [];
  const suitcase = leadingQuantity(text, "suitcases?");
  const box = leadingQuantity(text, "boxes?");
  const bicycle = leadingQuantity(text, "(?:bicycles|bikes|bicycle|bike)");
  if (suitcase) addItem(items, "suitcase", suitcase);
  if (box) addItem(items, "box", box);
  if (bicycle) addItem(items, "bicycle", bicycle);
  else if (/\bbicycle\b|\bbike\b/i.test(text)) addItem(items, "bicycle", 1);
  if (/mini[-\s]?fridge|refrigerator/i.test(text)) addItem(items, "mini-fridge", 1);
  return items;
}

function neighborhoodFrom(text: string): Neighborhood | "any" | null {
  const lower = text.toLowerCase();
  if (/anywhere|any neighborhood/.test(lower)) return "any";
  for (const name of NEIGHBORHOODS) {
    if (lower.includes(name.toLowerCase())) return name;
  }
  if (/old campus/.test(lower) || /near campus/.test(lower)) return "Old Campus";
  return null;
}

export function fallbackExtract(message: string, previous: SpaceRequest | null): SpaceRequest {
  const text = message.trim();
  const lower = text.toLowerCase();
  const next: SpaceRequest = previous
    ? {
        ...previous,
        items: previous.items.map((item) => ({ ...item })),
        accessRequirements: [...previous.accessRequirements],
        specialConstraints: [...previous.specialConstraints],
        missingInformation: [],
      }
    : emptyRequest();

  const mentionsParking = /\b(park|parking|driveway|suv|sedan)\b/i.test(text);
  const mentionsStorage = /\b(stor\w*|boxes|box|fridge|suitcase|closet|luggage|bicycle|bike)\b/i.test(text);
  if (mentionsParking && !mentionsStorage) next.category = "parking";
  else if (mentionsStorage && !/\b(park|parking|driveway)\b/i.test(text)) next.category = "storage";
  else if (/\b(park|parking|driveway)\b/i.test(text)) next.category = "parking";
  else if (mentionsStorage) next.category = "storage";

  const dates = findDates(text);
  if (dates[0]) next.startDate = dates[0];
  if (dates[1]) next.endDate = dates[1];
  if (dates[0] && !dates[1] && /for\s+[a-z]+\s+\d/.test(lower) && !/through|to /.test(lower)) {
    next.endDate = dates[0];
  }
  if (/only (?:park )?on sunday/i.test(text) && next.startDate && next.endDate) {
    const sunday = sundayWithin(next.startDate, next.endDate);
    if (sunday) {
      next.startDate = sunday;
      next.endDate = sunday;
      next.overnightRequired = false;
    }
  }

  if (/morning/i.test(text)) next.arrivalTime = next.arrivalTime ?? "09:00";
  if (/afternoon/i.test(text)) next.departureTime = "15:00";
  if (/evening/i.test(text)) next.departureTime = "18:00";

  const money = text.match(/\$(\d+(?:\.\d+)?)/);
  if (money) {
    next.budgetAmount = Number(money[1]);
    next.budgetIsMaximum = /under|less than|at most|no more than|max(?:imum)?|below/.test(lower);
    if (/per month|a month|\/month|monthly/.test(lower)) next.budgetUnit = "month";
    else if (/per day|a day|\/day|daily/.test(lower)) next.budgetUnit = "day";
    else if (/per hour|an hour|\/hour|hourly/.test(lower)) next.budgetUnit = "hour";
    else if (/total|altogether/.test(lower)) next.budgetUnit = "total";
    else next.budgetUnit = next.category === "storage" ? "month" : "total";
  } else if (/cheaper|less expensive|lower price|something cheaper/.test(lower) && next.budgetAmount) {
    next.budgetAmount = Math.max(10, Math.round(next.budgetAmount * 0.75));
    next.budgetIsMaximum = true;
  }

  const neighborhood = neighborhoodFrom(text);
  if (neighborhood) next.preferredNeighborhood = neighborhood;
  if (/closer to old campus/.test(lower)) next.preferredNeighborhood = "Old Campus";

  const parsedItems = parseItems(text);
  if (/also|as well|too/.test(lower) && parsedItems.length) {
    for (const item of parsedItems) addItem(next.items, item.name, item.quantity);
  } else if (parsedItems.length) {
    next.items = parsedItems;
  }

  if (/oversized|full-size truck|\bvan\b/.test(lower)) next.vehicleSize = "oversized";
  else if (/suv/.test(lower)) next.vehicleSize = "suv";
  else if (/sedan/.test(lower)) next.vehicleSize = "sedan";
  else if (/compact/.test(lower)) next.vehicleSize = "compact";
  if (next.vehicleSize) next.vehicleType = next.vehicleSize;

  if (/graduation/.test(lower)) next.eventType = "graduation";
  else if (/game day|football|yale bowl|harvard/.test(lower)) next.eventType = "game-day";
  else if (/move-in|move in/.test(lower)) next.eventType = "move-in";
  else if (/move-out|move out/.test(lower)) next.eventType = "move-out";
  else if (/semester/.test(lower)) next.eventType = "semester";

  if (/no overnight|not overnight|without overnight/.test(lower)) next.overnightRequired = false;
  else if (/overnight/.test(lower)) next.overnightRequired = true;

  if (/in and out|in-and-out/.test(lower)) next.inAndOutRequired = true;
  if (/covered/.test(lower)) next.coveredPreferred = true;
  if (/every weekend|access every weekend|on weekends/.test(lower)) {
    if (!next.accessRequirements.includes("weekend access")) next.accessRequirements.push("weekend access");
  }

  if (next.startDate && next.endDate && next.endDate > next.startDate && next.overnightRequired == null) {
    next.overnightRequired = true;
  }
  if (next.category === "storage") {
    next.capacityCubicFeetEstimate = estimateCubicFeet(next.items);
    if (next.startDate && next.endDate) {
      const days = Math.max(1, Math.round((Date.parse(next.endDate) - Date.parse(next.startDate)) / 86_400_000));
      next.storageDurationMonths = Math.max(1, Math.round(days / 30));
    }
  }

  if (next.category === "unclear") {
    next.missingInformation.push("Are you looking for storage or for parking?");
  }
  if (next.category === "parking" && (!next.startDate || !next.endDate)) {
    next.missingInformation.push(
      "Which dates should the parking cover? Share a start and end date. College Space does not assume Yale's event calendar.",
    );
  }
  if (next.category === "storage" && next.items.length === 0) {
    next.missingInformation.push("Which items do you need to store?");
  }
  return next;
}

export function fillGapsFromText(message: string, request: SpaceRequest) {
  const seeded = fallbackExtract(message, request);
  const explicitDates = findDates(message);
  const moneyInText = /\$\d/.test(message);
  const items = request.items.length > 0 ? request.items : seeded.items;
  return {
    ...request,
    category: request.category === "unclear" ? seeded.category : request.category,
    startDate: explicitDates[0] ?? request.startDate ?? seeded.startDate,
    endDate: explicitDates[1] ?? request.endDate ?? seeded.endDate,
    arrivalTime: request.arrivalTime ?? seeded.arrivalTime,
    departureTime: request.departureTime ?? seeded.departureTime,
    budgetAmount: moneyInText ? seeded.budgetAmount : (request.budgetAmount ?? seeded.budgetAmount),
    budgetUnit: moneyInText ? seeded.budgetUnit : (request.budgetUnit ?? seeded.budgetUnit),
    budgetIsMaximum: moneyInText ? seeded.budgetIsMaximum : request.budgetIsMaximum || seeded.budgetIsMaximum,
    preferredNeighborhood: request.preferredNeighborhood ?? seeded.preferredNeighborhood,
    items,
    vehicleSize: request.vehicleSize ?? seeded.vehicleSize,
    vehicleType: request.vehicleType ?? seeded.vehicleType,
    eventType: request.eventType ?? seeded.eventType,
    overnightRequired: request.overnightRequired ?? seeded.overnightRequired,
    inAndOutRequired: request.inAndOutRequired ?? seeded.inAndOutRequired,
    coveredPreferred: request.coveredPreferred ?? seeded.coveredPreferred,
    accessRequirements: request.accessRequirements.length ? request.accessRequirements : seeded.accessRequirements,
    capacityCubicFeetEstimate: estimateCubicFeet(items),
    missingInformation: request.missingInformation.length ? request.missingInformation : seeded.missingInformation,
  };
}
