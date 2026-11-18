"use client";

import { useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import { NEIGHBORHOODS } from "@/types/marketplace";
import type { HostAssistResponse, HostDraft } from "@/types/match";
import { emptyDrafts, localId, localTimestamp, readDrafts, saveDraft, subscribeStore } from "@/lib/browser-store";

const empty = {
  category: "storage" as "storage" | "parking",
  title: "",
  description: "",
  neighborhood: "",
  price: "",
  pricingUnit: "month",
  authority: false,
};

export function HostStudio() {
  const [mode, setMode] = useState<"storage" | "parking">("storage");
  const [form, setForm] = useState(empty);
  const [assistText, setAssistText] = useState("");
  const [draft, setDraft] = useState<HostDraft | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const saved = useSyncExternalStore(subscribeStore, readDrafts, emptyDrafts);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function assist(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/host-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: assistText }),
      });
      const data = (await response.json()) as HostAssistResponse & { error?: string };
      if (!response.ok) throw new Error(data.error || "The draft could not be created.");
      setDraft(data.draft);
      setNotice(data.inference === "grok" ? `Draft interpreted by Grok${data.model ? ` · ${data.model}` : ""}.` : data.notice);
      if (data.draft.category === "storage" || data.draft.category === "parking") {
        setMode(data.draft.category);
        setForm({
          category: data.draft.category,
          title: data.draft.title,
          description: data.draft.description,
          neighborhood: data.draft.neighborhood ?? "",
          price: data.draft.price != null ? String(data.draft.price) : "",
          pricingUnit: data.draft.pricingUnit ?? (data.draft.category === "storage" ? "month" : "day"),
          authority: false,
        });
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The draft could not be created.");
    } finally {
      setLoading(false);
    }
  }

  function save(event: FormEvent) {
    event.preventDefault();
    if (mode === "parking" && !form.authority) {
      setMessage(null);
      setError("Confirm that you have authority to rent the parking space before saving a preview.");
      return;
    }
    if (!form.title.trim() || !form.description.trim()) {
      setError("Add a title and description before saving.");
      return;
    }
    saveDraft({
      id: localId("draft"),
      createdAt: localTimestamp(),
      category: mode,
      title: form.title.trim(),
      description: form.description.trim(),
      neighborhood: form.neighborhood,
      price: form.price,
      pricingUnit: form.pricingUnit,
      authority: form.authority,
    });
    setError(null);
    setMessage("Saved in this browser only. It is not published and no one else can see it.");
  }

  const drafts = saved;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-gold">For hosts</p>
      <h1 className="display mt-3 text-5xl text-forest">Have a little extra room or an unused driveway?</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">Put it to good use. Describe it in your own words, review the draft, and keep a private preview on this browser. This demo does not publish listings.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form onSubmit={assist} className="rounded-3xl border border-line bg-paper p-5">
          <h2 className="display text-3xl text-forest">Listing assistant</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Grok can turn a rough note into a draft. It will not invent measurements, hours, or permission.</p>
          <label htmlFor="assist" className="mt-4 block text-sm text-forest">Informal description</label>
          <textarea
            id="assist"
            value={assistText}
            onChange={(event) => setAssistText(event.target.value)}
            rows={7}
            placeholder="I have an unused closet near Broadway. It's about six feet wide, and students can access it on weekends. I want to charge $60 per month."
            className="mt-2 w-full rounded-3xl border border-line bg-cream px-4 py-3"
          />
          <button type="submit" disabled={loading} className="mt-4 rounded-full bg-forest px-5 py-3 text-cream disabled:opacity-60">
            {loading ? "Drafting…" : "Draft with Grok"}
          </button>
          {notice ? <p className="mt-3 text-sm leading-6 text-forest">{notice}</p> : null}
          {error ? <p role="alert" className="mt-3 text-sm text-forest">{error}</p> : null}
          {draft?.missingQuestions.length ? (
            <div className="mt-4 rounded-2xl bg-sage-soft px-4 py-3 text-sm text-forest">
              <p>Still needed</p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                {draft.missingQuestions.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ) : null}
        </form>

        <form onSubmit={save} className="rounded-3xl border border-line bg-paper p-5">
          <div className="grid grid-cols-2 gap-2">
            {(["storage", "parking"] as const).map((category) => (
              <button
                key={category}
                type="button"
                aria-pressed={mode === category}
                onClick={() => {
                  setMode(category);
                  setForm((current) => ({ ...current, category, pricingUnit: category === "storage" ? "month" : "day" }));
                }}
                className={`rounded-full border px-3 py-2 capitalize ${mode === category ? "border-forest bg-forest text-cream" : "border-line"}`}
              >
                List {category}
              </button>
            ))}
          </div>
          <label className="mt-4 block text-sm text-forest">Title
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-1 w-full rounded-2xl border border-line bg-cream px-3 py-2.5" />
          </label>
          <label className="mt-3 block text-sm text-forest">Description
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={5} className="mt-1 w-full rounded-2xl border border-line bg-cream px-3 py-2.5" />
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-forest">Neighborhood
              <select value={form.neighborhood} onChange={(event) => setForm({ ...form, neighborhood: event.target.value })} className="mt-1 w-full rounded-2xl border border-line bg-cream px-3 py-2.5">
                <option value="">Choose</option>
                {NEIGHBORHOODS.map((name) => <option key={name}>{name}</option>)}
              </select>
            </label>
            <label className="text-sm text-forest">Price
              <input inputMode="decimal" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="mt-1 w-full rounded-2xl border border-line bg-cream px-3 py-2.5" />
            </label>
          </div>
          <label className="mt-3 block text-sm text-forest">Pricing unit
            <select value={form.pricingUnit} onChange={(event) => setForm({ ...form, pricingUnit: event.target.value })} className="mt-1 w-full rounded-2xl border border-line bg-cream px-3 py-2.5">
              <option value="hour">Per hour</option>
              <option value="day">Per day</option>
              <option value="month">Per month</option>
              <option value="event">Per event</option>
            </select>
          </label>
          {mode === "parking" ? (
            <label className="mt-4 flex items-start gap-2 text-sm leading-6">
              <input type="checkbox" checked={form.authority} onChange={(event) => setForm({ ...form, authority: event.target.checked })} className="mt-1" />
              I have the legal authority to rent this space. It is not a Yale-owned lot, a public street, or a shared driveway I cannot rent.
            </label>
          ) : null}
          <button type="submit" className="mt-5 rounded-full bg-forest px-5 py-3 text-cream">Save preview in this browser</button>
          {message ? <p role="status" className="mt-3 text-sm text-forest">{message}</p> : null}
        </form>
      </div>

      <section className="mt-8">
        <h2 className="display text-3xl text-forest">Browser-only previews</h2>
        {drafts.length === 0 ? <p className="mt-3 text-muted">Nothing saved yet.</p> : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {drafts.map((item) => (
              <article key={item.id} className="rounded-3xl border border-line bg-paper p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-muted">{item.category} · not published</p>
                <h3 className="display mt-2 text-2xl text-forest">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
                <p className="mt-3 text-sm">{item.neighborhood || "Neighborhood not set"} · {item.price || "Price not set"} / {item.pricingUnit}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
