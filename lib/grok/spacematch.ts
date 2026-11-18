import { explainMatch } from "@/lib/matching/explain";
import { fallbackExtract, fillGapsFromText } from "@/lib/matching/fallback";
import { matchListings } from "@/lib/matching/match";
import { coerceModelRequest, parseSpaceRequest } from "@/lib/matching/schema";
import type { SpaceRequest } from "@/types/match";
import type { Recommendation, SpaceMatchResponse } from "@/types/match";
import { explanationJsonSchema, extractionJsonSchema } from "@/lib/grok/extraction-schema";
import { GrokError, grokComplete, noticeFor, type GrokCompletion } from "@/lib/grok/client";

const EXTRACT_SYSTEM = `You extract a structured storage or parking request for College Space, a Yale student marketplace.
Return only the schema. Do not invent Yale event dates. If the user mentions graduation, move-in, move-out, or a game without a calendar date, leave startDate and endDate null and ask for dates in missingInformation.
Never assume an official Yale calendar. Dates are YYYY-MM-DD. Times are 24-hour HH:MM. Morning means 09:00, afternoon means 15:00, and evening means 18:00.
Neighborhoods must be one of: Old Campus, Broadway, Science Hill, Dwight, East Rock, Downtown New Haven, Yale Bowl, or null. "Near campus" together with Old Campus means Old Campus.
budgetIsMaximum is true only for under, less than, at most, maximum, or below. "Around" is not a maximum.
If a previous request is included, keep fields the new message does not change, including items unless the user removes them.
capacityCubicFeetEstimate may be a rough sum of the items, or null. Do not claim that any listing fits.`;

const EXPLAIN_SYSTEM = `You explain why listings that already passed hard filters match a request.
Use only the JSON facts. Do not invent amenities, prices, walking times, reviews, verification, or availability.
Write one or two short sentences. Mention the tradeoff when one is provided. If there is no tradeoff, use an empty string.
Do not mention a listing that is not in the payload.`;

export type Completer = (args: {
  system: string;
  user: string;
  schemaName: string;
  schema: object;
  maxTokens: number;
}) => Promise<GrokCompletion>;

function finalize(request: SpaceRequest): SpaceRequest {
  const next: SpaceRequest = {
    ...request,
    items: request.items.map((item) => ({ ...item })),
    missingInformation: [...request.missingInformation],
    accessRequirements: [...request.accessRequirements],
    specialConstraints: [...request.specialConstraints],
  };
  if (next.startDate && next.endDate && next.endDate < next.startDate) {
    const start = next.startDate;
    next.startDate = next.endDate;
    next.endDate = start;
  }
  if (
    next.category === "parking" &&
    next.overnightRequired == null &&
    next.startDate &&
    next.endDate &&
    next.endDate > next.startDate
  ) {
    next.overnightRequired = true;
  }
  if (next.startDate && next.endDate) {
    next.missingInformation = next.missingInformation.filter((item) => !/which dates|start and end date/i.test(item));
  }
  if (next.category === "parking" && (!next.startDate || !next.endDate)) {
    const question =
      "Which dates should the parking cover? Share a start and end date. College Space does not assume Yale's event calendar.";
    if (!next.missingInformation.some((item) => /date/i.test(item))) next.missingInformation.push(question);
  }
  return next;
}

function grounded(text: string, price: number, total: number | null) {
  if (text.length < 20 || text.length > 700) return false;
  if (/verified|star review|minute walk|minutes away|official yale calendar/i.test(text)) return false;
  const allowed = new Set([price, total].filter((value): value is number => value != null).map((value) => Math.round(value)));
  const amounts = [...text.matchAll(/\$(\d+)/g)].map((match) => Number(match[1]));
  return amounts.every((amount) => allowed.has(amount));
}

async function explainWithGrok(request: SpaceRequest, recommendations: Recommendation[], complete: Completer, model: string | null) {
  const facts = recommendations.map((item) => ({
    listingId: item.listingId,
    label: item.label,
    tradeoff: item.tradeoff,
    fits: item.fits,
    estimate: item.estimate,
    facts: item.explanation,
  }));
  try {
    const result = await complete({
      system: EXPLAIN_SYSTEM,
      user: JSON.stringify({ request, listings: facts }),
      schemaName: "space_explanations",
      schema: explanationJsonSchema,
      maxTokens: 900,
    });
    const summaries = (result.json as { summaries?: Array<{ listingId?: string; explanation?: string; tradeoff?: string }> }).summaries;
    if (!Array.isArray(summaries)) return { recommendations, model };
    const byId = new Map(summaries.filter((item) => item.listingId).map((item) => [item.listingId as string, item]));
    const next = recommendations.map((item) => {
      const summary = byId.get(item.listingId);
      const total = item.estimate?.amount ?? null;
      const priceMatch = item.explanation.match(/\$(\d+)/);
      const price = priceMatch ? Number(priceMatch[1]) : total ?? 0;
      if (!summary?.explanation || !grounded(summary.explanation, price, total)) return item;
      return {
        ...item,
        explanation: summary.explanation.trim(),
        tradeoff: summary.tradeoff?.trim() || item.tradeoff,
        explanationSource: "grok" as const,
      };
    });
    return { recommendations: next, model: result.model ?? model };
  } catch {
    return { recommendations, model };
  }
}

export async function runSpaceMatch(
  message: string,
  previous: SpaceRequest | null,
  complete: Completer = grokComplete,
): Promise<SpaceMatchResponse> {
  let request = fallbackExtract(message, previous);
  let inference: SpaceMatchResponse["inference"] = "fallback";
  let notice: string | null = noticeFor("MISSING_KEY");
  let model: string | null = null;

  const hasKey = Boolean(process.env.XAI_API_KEY);
  if (hasKey || complete !== grokComplete) {
    try {
      const result = await complete({
        system: EXTRACT_SYSTEM,
        user: `Previous request JSON:\n${previous ? JSON.stringify(previous) : "null"}\n\nNew message:\n${message}`,
        schemaName: "space_request",
        schema: extractionJsonSchema,
        maxTokens: 1200,
      });
      const parsed = parseSpaceRequest(coerceModelRequest(result.json));
      if (!parsed.success) throw new GrokError("INVALID_OUTPUT");
      request = fillGapsFromText(message, parsed.data);
      inference = "grok";
      notice = null;
      model = result.model;
    } catch (error) {
      const code = error instanceof GrokError ? error.code : "UPSTREAM";
      request = fallbackExtract(message, previous);
      inference = "fallback";
      notice = noticeFor(code);
      model = null;
    }
  }

  request = finalize(request);
  const matched = matchListings(request);
  let recommendations: Recommendation[] = matched.eligible.map((item) => ({
    listingId: item.listing.id,
    score: item.score,
    label: item.label,
    explanation: explainMatch(item, request),
    explanationSource: "template",
    tradeoff: item.tradeoff,
    fits: item.fits,
    estimate: item.estimate,
  }));

  if (inference === "grok" && recommendations.length > 0) {
    const explained = await explainWithGrok(request, recommendations, complete, model);
    recommendations = explained.recommendations;
    model = explained.model;
  }

  const emptyReason =
    request.category === "unclear"
      ? "Say whether you need storage or parking, and include the neighborhood, dates, and budget you care about."
      : recommendations.length === 0
        ? "None of the fictional demo listings passed the hard constraints. Over-budget, unavailable, and incompatible spaces were left out."
        : null;

  return {
    inference,
    model,
    notice,
    request,
    recommendations,
    excluded: matched.excluded.slice(0, 4),
    emptyReason,
  };
}
