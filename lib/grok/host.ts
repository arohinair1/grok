import { z } from "zod";
import { NEIGHBORHOODS, type Neighborhood } from "@/types/marketplace";
import type { HostAssistResponse, HostDraft } from "@/types/match";
import { hostJsonSchema } from "@/lib/grok/extraction-schema";
import { GrokError, grokComplete, noticeFor, type GrokCompletion } from "@/lib/grok/client";

const hostDraftSchema = z.object({
  category: z.enum(["storage", "parking", "unclear"]),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(1_200),
  neighborhood: z.enum(NEIGHBORHOODS).nullable(),
  price: z.number().min(0).max(100_000).nullable(),
  pricingUnit: z.enum(["hour", "day", "month", "event"]).nullable(),
  missingQuestions: z.array(z.string().max(240)).max(8),
  restrictions: z.array(z.string().max(200)).max(8),
  notes: z.array(z.string().max(240)).max(8),
});

const HOST_SYSTEM = `You turn a host's informal description into a listing draft for College Space at Yale.
Use only facts the host stated. Never invent dimensions, security features, access hours, availability, ownership, or verification.
If a required fact is missing, leave the field null and add a short question.
For parking, ask whether the host has legal authority to rent the space unless they already confirmed it.
Do not describe the space as verified. Neighborhood must be one of: Old Campus, Broadway, Science Hill, Dwight, East Rock, Downtown New Haven, Yale Bowl, or null.
The description should be polished but must not add amenities or measurements.`;

function neighborhoodOf(text: string): Neighborhood | null {
  const lower = text.toLowerCase();
  for (const name of NEIGHBORHOODS) {
    if (lower.includes(name.toLowerCase())) return name;
  }
  if (/old campus|near campus/.test(lower)) return "Old Campus";
  return null;
}

export function fallbackHostDraft(description: string): HostDraft {
  const text = description.trim();
  const lower = text.toLowerCase();
  const parking = /\b(park|parking|driveway|spot)\b/i.test(text);
  const category = parking ? "parking" : /\b(closet|storage|room|basement|store)\b/i.test(text) ? "storage" : "unclear";
  const neighborhood = neighborhoodOf(text);
  const priceMatch = text.match(/\$(\d+(?:\.\d+)?)/);
  const price = priceMatch ? Number(priceMatch[1]) : null;
  let pricingUnit: HostDraft["pricingUnit"] = null;
  if (/per hour|an hour|\/hour/.test(lower)) pricingUnit = "hour";
  else if (/per day|a day|\/day/.test(lower)) pricingUnit = "day";
  else if (/per month|a month|\/month/.test(lower)) pricingUnit = "month";
  else if (/weekend|event/.test(lower) && price != null) pricingUnit = "event";
  else if (price != null) pricingUnit = category === "storage" ? "month" : "day";

  const place = neighborhood ? `near ${neighborhood}` : "around Yale";
  const title =
    category === "parking"
      ? `Parking space ${place}`
      : category === "storage"
        ? `Storage space ${place}`
        : "Untitled space";

  const notes: string[] = [];
  if (/(\d+)\s*(feet|ft)\s*wide/i.test(text)) {
    notes.push("You mentioned a width. Depth and height were not both provided, so no volume was calculated.");
  }
  if (/sedan|suv/i.test(text)) {
    notes.push("Vehicle sizes were kept only as you described them.");
  }

  const missingQuestions: string[] = [];
  if (!neighborhood) missingQuestions.push("Which neighborhood is the space in?");
  if (price == null) missingQuestions.push("What price do you want to charge, and is it hourly, daily, monthly, or a flat event rate?");
  if (category === "storage" && !/feet|ft|wide|closet|room|basement/i.test(text)) {
    missingQuestions.push("About how large is the space?");
  }
  if (category === "parking") {
    missingQuestions.push(
      "Do you have the legal authority to rent this space, including any lease or city permission? Yale-owned lots, street spaces, and unauthorized shared driveways cannot be listed.",
    );
    if (!/overnight/i.test(text)) missingQuestions.push("Can a car stay overnight?");
    if (!/sedan|suv|compact|car/i.test(text)) missingQuestions.push("What is the largest vehicle that fits?");
  }
  if (!/available|weekend|month|may|june|summer|graduation/i.test(text)) {
    missingQuestions.push("Which dates or days can someone use it?");
  }

  const restrictions = ["Fictional draft until you review it. This demo does not publish listings publicly."];
  if (category === "parking") restrictions.push("Only list a space you are legally allowed to rent.");

  return {
    category,
    title,
    description: text || "No description yet.",
    neighborhood,
    price,
    pricingUnit,
    missingQuestions,
    restrictions,
    notes,
  };
}

type Completer = (args: {
  system: string;
  user: string;
  schemaName: string;
  schema: object;
  maxTokens: number;
}) => Promise<GrokCompletion>;

export async function runHostAssist(description: string, complete: Completer = grokComplete): Promise<HostAssistResponse> {
  const fallback = fallbackHostDraft(description);
  if (!process.env.XAI_API_KEY && complete === grokComplete) {
    return { inference: "fallback", model: null, notice: noticeFor("MISSING_KEY"), draft: fallback };
  }
  try {
    const result = await complete({
      system: HOST_SYSTEM,
      user: description,
      schemaName: "host_draft",
      schema: hostJsonSchema,
      maxTokens: 900,
    });
    const parsed = hostDraftSchema.safeParse(result.json);
    if (!parsed.success) throw new GrokError("INVALID_OUTPUT");
    const draft = parsed.data;
    if (!draft.missingQuestions.some((item) => /authority|legal/i.test(item)) && draft.category === "parking") {
      draft.missingQuestions.push(
        "Please confirm you have legal authority to rent this space. This draft does not assume permission.",
      );
    }
    return { inference: "grok", model: result.model, notice: null, draft };
  } catch (error) {
    const code = error instanceof GrokError ? error.code : "UPSTREAM";
    return { inference: "fallback", model: null, notice: noticeFor(code), draft: fallback };
  }
}
