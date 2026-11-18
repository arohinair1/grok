"use client";

import { useMemo, useState, type FormEvent } from "react";
import { bookingBlockers, quoteListing } from "@/lib/matching/quote";
import { money } from "@/lib/format";
import { localId, localTimestamp, saveBooking } from "@/lib/browser-store";
import type { Listing } from "@/types/marketplace";

export function BookingPanel({ listing }: { listing: Listing }) {
  const [startDate, setStartDate] = useState(listing.availability.start);
  const [endDate, setEndDate] = useState(
    listing.availability.end < "2027-06-01" ? listing.availability.end : listing.availability.start,
  );
  const [arrivalTime, setArrivalTime] = useState(listing.category === "parking" ? "09:00" : "");
  const [departureTime, setDepartureTime] = useState(listing.category === "parking" ? "15:00" : "");
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stay = useMemo(
    () => ({
      startDate: startDate || null,
      endDate: endDate || null,
      arrivalTime: arrivalTime || null,
      departureTime: departureTime || null,
    }),
    [startDate, endDate, arrivalTime, departureTime],
  );
  const blockers = bookingBlockers(listing, stay);
  const quote = blockers.length === 0 ? quoteListing(listing, stay) : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    setConfirmation(null);
    if (blockers.length || !quote || !stay.startDate || !stay.endDate) {
      setError(blockers[0] ?? "Add the dates for this stay.");
      return;
    }
    saveBooking({
      id: localId("demo"),
      listingId: listing.id,
      title: listing.title,
      category: listing.category,
      startDate: stay.startDate,
      endDate: stay.endDate,
      arrivalTime: stay.arrivalTime ?? "",
      departureTime: stay.departureTime ?? "",
      amount: quote.amount,
      quantityLabel: quote.quantityLabel,
      assumption: quote.assumption,
      createdAt: localTimestamp(),
    });
    setError(null);
    setConfirmation("Simulated request saved in this browser. No host was contacted, and no payment was taken.");
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-line bg-paper p-5 shadow-[0_18px_40px_rgba(36,48,43,0.05)]">
      <p className="text-xs uppercase tracking-[0.16em] text-gold">Simulated request</p>
      <h2 className="display mt-2 text-3xl text-forest">Request this space</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        This demo checks the dates and calculates a price. It does not message a host or reserve anything.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-forest">
          Start date
          <input required type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 w-full rounded-2xl border border-line bg-cream px-3 py-2.5" />
        </label>
        <label className="text-sm text-forest">
          End date
          <input required type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-1 w-full rounded-2xl border border-line bg-cream px-3 py-2.5" />
        </label>
        {listing.category === "parking" ? (
          <>
            <label className="text-sm text-forest">
              Arrival
              <input type="time" value={arrivalTime} onChange={(event) => setArrivalTime(event.target.value)} className="mt-1 w-full rounded-2xl border border-line bg-cream px-3 py-2.5" />
            </label>
            <label className="text-sm text-forest">
              Departure
              <input type="time" value={departureTime} onChange={(event) => setDepartureTime(event.target.value)} className="mt-1 w-full rounded-2xl border border-line bg-cream px-3 py-2.5" />
            </label>
          </>
        ) : null}
      </div>
      {blockers.length > 0 ? (
        <ul className="mt-4 space-y-1 text-sm text-forest">
          {blockers.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : quote ? (
        <div className="mt-4 rounded-2xl bg-sage-soft px-4 py-3 text-sm leading-6 text-forest">
          <p className="text-base">{money(quote.amount)} estimated</p>
          <p>{quote.quantityLabel}</p>
          <p>{quote.assumption}</p>
        </div>
      ) : null}
      {error ? <p className="mt-3 text-sm text-forest" role="alert">{error}</p> : null}
      {confirmation ? <p className="mt-3 text-sm text-forest" role="status">{confirmation}</p> : null}
      <button type="submit" className="mt-5 w-full rounded-full bg-forest px-4 py-3 text-cream transition hover:bg-forest-deep">
        Submit demo request
      </button>
    </form>
  );
}
