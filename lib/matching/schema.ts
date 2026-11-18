import { z } from "zod";
import { NEIGHBORHOODS } from "@/types/marketplace";
import { emptyRequest, type SpaceRequest } from "@/types/match";

const dateValue = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeValue = z.string().regex(/^\d{2}:\d{2}$/);

export const spaceRequestSchema = z.object({
  category: z.enum(["storage", "parking", "unclear"]),
  startDate: dateValue.nullable(),
  endDate: dateValue.nullable(),
  arrivalTime: timeValue.nullable(),
  departureTime: timeValue.nullable(),
  budgetAmount: z.number().min(0).max(100_000).nullable(),
  budgetUnit: z.enum(["hour", "day", "month", "event", "total"]).nullable(),
  budgetIsMaximum: z.boolean(),
  preferredNeighborhood: z.enum([...NEIGHBORHOODS, "any"]).nullable(),
  accessRequirements: z.array(z.string().max(160)).max(8),
  specialConstraints: z.array(z.string().max(160)).max(8),
  missingInformation: z.array(z.string().max(240)).max(6),
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        quantity: z.number().int().min(1).max(100),
      }),
    )
    .max(12),
  capacityCubicFeetEstimate: z.number().min(0).max(5_000).nullable(),
  storageDurationMonths: z.number().min(0).max(36).nullable(),
  vehicleType: z.string().max(80).nullable(),
  vehicleSize: z.enum(["compact", "sedan", "suv", "oversized"]).nullable(),
  eventType: z
    .enum(["graduation", "move-in", "move-out", "game-day", "campus-event", "semester", "visit", "other"])
    .nullable(),
  overnightRequired: z.boolean().nullable(),
  inAndOutRequired: z.boolean().nullable(),
  coveredPreferred: z.boolean().nullable(),
  walkingPreference: z.string().max(160).nullable(),
});

export function parseSpaceRequest(input: unknown) {
  return spaceRequestSchema.safeParse(input);
}

function asRecord(input: unknown) {
  return input && typeof input === "object" ? (input as Record<string, unknown>) : null;
}

function nullableNumber(value: unknown) {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  return value;
}

export function coerceModelRequest(input: unknown): unknown {
  const record = asRecord(input);
  if (!record) return input;
  const items = Array.isArray(record.items)
    ? record.items.map((item) => {
        const entry = asRecord(item);
        if (!entry) return item;
        return { ...entry, quantity: nullableNumber(entry.quantity) ?? entry.quantity };
      })
    : record.items;
  return {
    ...emptyRequest(),
    ...record,
    budgetAmount: nullableNumber(record.budgetAmount),
    capacityCubicFeetEstimate: nullableNumber(record.capacityCubicFeetEstimate),
    storageDurationMonths: nullableNumber(record.storageDurationMonths),
    items,
    accessRequirements: Array.isArray(record.accessRequirements) ? record.accessRequirements : [],
    specialConstraints: Array.isArray(record.specialConstraints) ? record.specialConstraints : [],
    missingInformation: Array.isArray(record.missingInformation) ? record.missingInformation : [],
  };
}

export function isSpaceRequest(value: SpaceRequest) {
  return spaceRequestSchema.safeParse(value).success;
}
