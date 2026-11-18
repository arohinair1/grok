import { z } from "zod";
import { runSpaceMatch } from "@/lib/grok/spacematch";
import { parseSpaceRequest } from "@/lib/matching/schema";
import { allowRequest, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const bodySchema = z.object({
  message: z.string().trim().min(2).max(1500),
  previous: z.unknown().optional().nullable(),
});

export async function POST(request: Request) {
  if (!allowRequest(`match:${clientKey(request)}`)) {
    return Response.json({ error: "Too many requests. Wait a minute and try again." }, { status: 429 });
  }
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 20_000) return Response.json({ error: "That request is too large." }, { status: 413 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Send a JSON message describing the space you need." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Describe what you need in a sentence or two." }, { status: 400 });
  }

  let previous = null;
  if (parsed.data.previous) {
    const prior = parseSpaceRequest(parsed.data.previous);
    if (!prior.success) {
      return Response.json({ error: "The previous request could not be read. Start a new search." }, { status: 400 });
    }
    previous = prior.data;
  }

  const result = await runSpaceMatch(parsed.data.message, previous);
  return Response.json(result);
}
