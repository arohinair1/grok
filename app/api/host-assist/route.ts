import { z } from "zod";
import { runHostAssist } from "@/lib/grok/host";
import { allowRequest, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const bodySchema = z.object({
  description: z.string().trim().min(8).max(2000),
});

export async function POST(request: Request) {
  if (!allowRequest(`host:${clientKey(request)}`, 8)) {
    return Response.json({ error: "Too many drafts. Wait a minute and try again." }, { status: 429 });
  }
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 20_000) return Response.json({ error: "That description is too large." }, { status: 413 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Send the description as JSON." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Describe the space in a few sentences before asking for a draft." }, { status: 400 });
  }
  const result = await runHostAssist(parsed.data.description);
  return Response.json(result);
}
