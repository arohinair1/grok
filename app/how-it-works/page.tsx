import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "How It Works" };

const renter = [
  ["Describe what you need.", "A summer closet, a mini-fridge, or a driveway for a family visit. Ordinary language is enough."],
  ["Get matched with relevant spaces.", "Grok reads the request. The catalog then applies the hard rules before anything is recommended."],
  ["Review details and request a booking.", "Open a listing, check the limits, and send a simulated request. No payment is taken."],
];

const host = [
  ["Describe your extra storage or parking.", "A closet, a basement corner, or a driveway you are allowed to rent."],
  ["Create a listing.", "Review the draft. Missing facts stay missing until you add them."],
  ["Review incoming requests.", "In this demo, requests stay in the browser. A real host is not notified."],
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.18em] text-gold">How it works</p>
      <h1 className="display mt-3 max-w-3xl text-5xl text-forest">Space, matched to the week you actually need it.</h1>
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="display text-3xl text-forest">For renters</h2>
          <ol className="mt-5 space-y-5">
            {renter.map(([title, body], index) => (
              <li key={title} className="rounded-3xl border border-line bg-paper p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-muted">0{index + 1}</p>
                <h3 className="mt-2 text-xl text-forest">{title}</h3>
                <p className="mt-2 leading-7 text-muted">{body}</p>
              </li>
            ))}
          </ol>
        </section>
        <section>
          <h2 className="display text-3xl text-forest">For hosts</h2>
          <ol className="mt-5 space-y-5">
            {host.map(([title, body], index) => (
              <li key={title} className="rounded-3xl border border-line bg-paper p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-muted">0{index + 1}</p>
                <h3 className="mt-2 text-xl text-forest">{title}</h3>
                <p className="mt-2 leading-7 text-muted">{body}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/spacematch" className="rounded-full bg-forest px-5 py-3 text-cream">Try SpaceMatch</Link>
        <Link href="/host" className="rounded-full border border-forest px-5 py-3 text-forest">List a space</Link>
      </div>
    </div>
  );
}
