import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <p className="text-xs uppercase tracking-[0.18em] text-gold">Demo account</p>
      <h1 className="display mt-3 text-5xl text-forest">No sign-in for this demo.</h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        College Space — Yale does not ask you to create an account. Saved spaces, booking requests, and host previews stay in this browser and are not tied to a Yale student record.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/bookings" className="rounded-full bg-forest px-5 py-3 text-cream">View demo bookings</Link>
        <Link href="/find?saved=1" className="rounded-full border border-forest px-5 py-3 text-forest">Saved listings</Link>
      </div>
    </div>
  );
}
