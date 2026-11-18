export const GROK_MODEL = process.env.XAI_MODEL || "grok-4.7";

const ENDPOINT = "https://api.x.ai/v1/chat/completions";

export type GrokCompletion = {
  json: unknown;
  model: string | null;
};

type CompletionArgs = {
  system: string;
  user: string;
  schemaName: string;
  schema: object;
  maxTokens: number;
};

export class GrokError extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
    this.name = "GrokError";
  }
}

async function requestCompletion(key: string, body: Record<string, unknown>) {
  try {
    return await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(28_000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") throw new GrokError("TIMEOUT");
    if (error instanceof Error && error.name === "AbortError") throw new GrokError("TIMEOUT");
    throw new GrokError("UPSTREAM");
  }
}

export async function grokComplete(args: CompletionArgs): Promise<GrokCompletion> {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new GrokError("MISSING_KEY");

  const base = {
    model: GROK_MODEL,
    temperature: 0.1,
    max_completion_tokens: args.maxTokens,
    messages: [
      { role: "system", content: args.system },
      { role: "user", content: args.user },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: args.schemaName,
        strict: true,
        schema: args.schema,
      },
    },
  };

  let response = await requestCompletion(key, { ...base, reasoning_effort: "low" });
  if (response.status === 400) {
    response = await requestCompletion(key, base);
  }
  if (response.status === 429) throw new GrokError("RATE_LIMIT");
  if (!response.ok) throw new GrokError("UPSTREAM");

  const payload = (await response.json()) as {
    model?: string;
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new GrokError("INVALID_OUTPUT");
  try {
    return { json: JSON.parse(content) as unknown, model: payload.model ?? GROK_MODEL };
  } catch {
    throw new GrokError("INVALID_OUTPUT");
  }
}

export function noticeFor(code: string) {
  switch (code) {
    case "MISSING_KEY":
      return "XAI_API_KEY is not configured on the server, so this result used the on-device parser. It is not Grok inference.";
    case "RATE_LIMIT":
      return "Grok rate-limited the request. These results used the on-device parser and are not Grok inference.";
    case "TIMEOUT":
      return "Grok took too long to answer. These results used the on-device parser and are not Grok inference.";
    case "INVALID_OUTPUT":
      return "Grok returned a response that failed validation. These results used the on-device parser and are not Grok inference.";
    default:
      return "Grok could not be reached. These results used the on-device parser and are not Grok inference.";
  }
}
