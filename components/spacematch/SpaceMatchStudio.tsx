"use client";

import Link from "next/link";
import { useState } from "react";
import { EXAMPLE_PROMPTS } from "@/data/prompts";
import { getListing } from "@/data/listings";
import { formatDate, money, priceLabel } from "@/lib/format";
import type { SpaceMatchResponse, SpaceRequest } from "@/types/match";

const followUps = [
  "Actually, I need something cheaper.",
  "Can you show me options closer to Old Campus?",
  "I also need to store a bicycle.",
  "Actually, we need overnight parking.",
  "We have a larger SUV.",
  "What if we only park on Sunday?",
];

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="mt-1 text-charcoal">{value}</dd>
    </div>
  );
}

function requestSummary(request: SpaceRequest) {
  const budget = request.budgetAmount == null
    ? "Not specified"
    : `${money(request.budgetAmount)} ${request.budgetUnit ?? ""}${request.budgetIsMaximum ? " maximum" : ""}`.trim();
  const dates = request.startDate
    ? `${formatDate(request.startDate)} – ${formatDate(request.endDate ?? request.startDate)}`
    : "Dates not provided";
  const items = request.items.length
    ? request.items.map((item) => `${item.quantity} ${item.name}`).join(", ")
    : "None listed";
  return { budget, dates, items };
}

export function SpaceMatchStudio({ initialPrompt }: { initialPrompt: string }) {
  const [message, setMessage] = useState(initialPrompt);
  const [previous, setPrevious] = useState<SpaceRequest | null>(null);
  const [result, setResult] = useState<SpaceMatchResponse | null>(null);
  const [asked, setAsked] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(text: string, prior: SpaceRequest | null) {
    const trimmed = text.trim();
    if (trimmed.length < 2) {
      setError("Tell Grok what you need to store or where you need to park.");
      return;
    }
    setLoading(true);
    setError(null);
    setAsked(trimmed);
    try {
      const response = await fetch("/api/spacematch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, previous: prior }),
      });
      const data = (await response.json()) as SpaceMatchResponse & { error?: string };
      if (!response.ok) throw new Error(data.error || "SpaceMatch could not complete that request.");
      setResult(data);
      setPrevious(data.request);
      setMessage("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "SpaceMatch could not complete that request.");
    } finally {
      setLoading(false);
    }
  }

  const summary = result ? requestSummary(result.request) : null;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-gold">Grok SpaceMatch</p>
      <h1 className="display mt-3 max-w-3xl text-5xl leading-tight text-forest">Tell us what you need. Grok will help find a space that fits.</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
        Describe a storage stay or a parking stay in ordinary language. SpaceMatch reads the constraints, then ranks the fictional Yale listings that actually fit.
      </p>

      <form
        className="mt-8 rounded-[2rem] border border-line bg-paper p-4 shadow-[0_18px_50px_rgba(36,48,43,0.05)] md:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(message, previous);
        }}
      >
        <label htmlFor="request" className="text-sm text-forest">Your request</label>
        <textarea
          id="request"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={5}
          maxLength={1500}
          placeholder="I need summer storage near Old Campus, or a driveway for graduation weekend."
          className="mt-2 w-full resize-y rounded-3xl border border-line bg-cream px-4 py-3 leading-7"
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted">Dates in the examples are explicit demo dates, not an official Yale calendar.</p>
          <button type="submit" disabled={loading} className="rounded-full bg-forest px-5 py-3 text-cream disabled:opacity-60">
            {loading ? "Reading your request…" : previous ? "Refine matches" : "Find my space"}
          </button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt.id}
            type="button"
            onClick={() => setMessage(prompt.text)}
            className="rounded-full border border-line bg-paper px-3 py-2 text-sm text-forest transition hover:border-forest"
          >
            {prompt.label}
          </button>
        ))}
      </div>

      {error ? (
        <p role="alert" className="mt-6 rounded-2xl border border-line bg-warm px-4 py-3 text-sm text-forest">{error}</p>
      ) : null}

      {loading ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2" aria-live="polite">
          <div className="h-56 animate-pulse rounded-3xl bg-cream-deep" />
          <div className="h-56 animate-pulse rounded-3xl bg-cream-deep" />
        </div>
      ) : null}

      {result && summary ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-3xl border border-line bg-paper p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.14em] ${result.inference === "grok" ? "bg-forest text-cream" : "bg-warm text-forest"}`}>
                {result.inference === "grok" ? `Interpreted by Grok${result.model ? ` · ${result.model}` : ""}` : "On-device parser"}
              </span>
            </div>
            {result.notice ? <p className="mt-3 text-sm leading-6 text-forest">{result.notice}</p> : null}
            {asked ? <p className="mt-4 text-sm leading-6 text-muted">“{asked}”</p> : null}
            <dl className="mt-5 grid gap-4">
              <Field label="Category" value={result.request.category} />
              <Field label="Dates" value={summary.dates} />
              <Field label="Budget" value={summary.budget} />
              <Field label="Neighborhood" value={result.request.preferredNeighborhood ?? "No preference yet"} />
              <Field label="Items" value={summary.items} />
              <Field label="Vehicle" value={result.request.vehicleSize ?? "Not specified"} />
              <Field label="Overnight" value={result.request.overnightRequired == null ? "Not specified" : result.request.overnightRequired ? "Required" : "Not required"} />
            </dl>
            {result.request.missingInformation.length > 0 ? (
              <div className="mt-5 rounded-2xl bg-sage-soft px-4 py-3 text-sm text-forest">
                <p className="font-medium">Still useful to know</p>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  {result.request.missingInformation.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <details className="mt-5 text-sm text-muted">
              <summary className="cursor-pointer text-forest">How ranking works</summary>
              <p className="mt-2 leading-6">
                Hard rules run before any explanation: category, dates, budget maximums, vehicle size, overnight rules, item restrictions, and capacity. Eligible listings are then ordered by location, price for the whole stay, fit, availability, and access. The labels are rankings, not probabilities.
              </p>
            </details>
          </section>

          <section className="space-y-4">
            {result.emptyReason ? (
              <div className="rounded-3xl border border-dashed border-line bg-paper px-5 py-8">
                <h2 className="display text-3xl text-forest">No bookable match</h2>
                <p className="mt-3 leading-7 text-muted">{result.emptyReason}</p>
              </div>
            ) : null}
            {result.recommendations.map((item) => {
              const listing = getListing(item.listingId);
              if (!listing) return null;
              return (
                <article key={item.listingId} className="rounded-3xl border border-line bg-paper p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs uppercase tracking-[0.14em] text-gold">{item.label}</p>
                    <p className="text-sm text-muted">{priceLabel(listing)}</p>
                  </div>
                  <h2 className="display mt-2 text-3xl text-forest">
                    <Link href={`/listings/${listing.id}`}>{listing.title}</Link>
                  </h2>
                  <p className="mt-3 leading-7 text-charcoal">{item.explanation}</p>
                  {item.tradeoff ? <p className="mt-2 text-sm text-muted">Tradeoff: {item.tradeoff}</p> : null}
                  <ul className="mt-4 flex flex-wrap gap-2 text-xs">
                    <li className="rounded-full bg-cream-deep px-3 py-1">Budget {item.fits.budget}</li>
                    <li className="rounded-full bg-cream-deep px-3 py-1">Fit {item.fits.capacity}</li>
                    <li className="rounded-full bg-cream-deep px-3 py-1">Location {item.fits.location}</li>
                    <li className="rounded-full bg-cream-deep px-3 py-1">Dates {item.fits.availability}</li>
                    <li className="rounded-full bg-cream-deep px-3 py-1">Access {item.fits.access}</li>
                  </ul>
                  {item.estimate ? (
                    <p className="mt-3 text-sm text-forest">
                      {money(item.estimate.amount)} · {item.estimate.quantityLabel}. {item.estimate.assumption}
                    </p>
                  ) : null}
                  <p className="mt-3 text-xs uppercase tracking-[0.14em] text-muted">
                    {item.explanationSource === "grok" ? "Explanation by Grok" : "Explanation from listing facts"}
                  </p>
                </article>
              );
            })}
            {result.excluded.length > 0 ? (
              <div className="rounded-3xl bg-warm px-5 py-4 text-sm leading-6">
                <p className="text-forest">Left out on purpose</p>
                <ul className="mt-2 space-y-2 text-muted">
                  {result.excluded.map((item) => (
                    <li key={item.id}><span className="text-charcoal">{item.title}.</span> {item.reason}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      {result ? (
        <div className="mt-8">
          <p className="text-sm text-forest">Refine this search</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {followUps.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={loading}
                onClick={() => void submit(prompt, result.request)}
                className="rounded-full border border-line bg-paper px-3 py-2 text-sm text-forest"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
