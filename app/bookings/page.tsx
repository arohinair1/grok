"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { emptyBookings, readBookings, subscribeStore } from "@/lib/browser-store";
import { formatDate, money } from "@/lib/format";

export default function BookingsPage() {
  const bookings = useSyncExternalStore(subscribeStore, readBookings, emptyBookings);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.18em] text-gold">This browser only</p>
      <h1 className="display mt-3 text-5xl text-forest">My bookings</h1>
      <p className="mt-4 leading-7 text-muted">These are simulated requests saved locally. No host received them, and they disappear if you clear this browser&apos;s storage.</p>
      {bookings.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-line bg-paper px-6 py-12 text-center">
          <p className="display text-3xl text-forest">No requests yet</p>
          <Link href="/find" className="mt-4 inline-flex text-forest underline underline-offset-4">Browse listings</Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {bookings.map((booking) => (
            <article key={booking.id} className="rounded-3xl border border-line bg-paper p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">Simulated · {booking.category}</p>
              <h2 className="display mt-2 text-3xl text-forest">
                <Link href={`/listings/${booking.listingId}`}>{booking.title}</Link>
              </h2>
              <p className="mt-2 text-charcoal">{formatDate(booking.startDate)} – {formatDate(booking.endDate)}</p>
              {booking.arrivalTime ? <p className="text-sm text-muted">{booking.arrivalTime} to {booking.departureTime}</p> : null}
              <p className="mt-3 text-forest">{money(booking.amount)} · {booking.quantityLabel}</p>
              <p className="text-sm text-muted">{booking.assumption}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
