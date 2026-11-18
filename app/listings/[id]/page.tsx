import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingPanel } from "@/components/marketplace/BookingPanel";
import { FavoriteButton } from "@/components/marketplace/FavoriteButton";
import { getListing, listings } from "@/data/listings";
import { formatDate, priceLabel } from "@/lib/format";

export function generateStaticParams() {
  return listings.map((listing) => ({ id: listing.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const listing = getListing(id);
  return { title: listing?.title ?? "Listing" };
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = getListing(id);
  if (!listing) notFound();

  const facts = [
    ["Neighborhood", listing.neighborhood],
    ["Area", listing.areaNote],
    ["Price", priceLabel(listing)],
    ["Access", listing.accessHours],
    ["Available", `${formatDate(listing.availability.start)} – ${formatDate(listing.availability.end)}`],
    ["Capacity", listing.capacityLabel],
  ];
  if (listing.climate) facts.push(["Climate", listing.climate]);
  if (listing.spotType) facts.push(["Space", listing.spotType]);
  if (listing.vehicleSizeLimit) facts.push(["Largest vehicle", listing.vehicleSizeLimit]);
  if (listing.category === "parking") {
    facts.push(["Overnight", listing.overnight ? "Allowed" : "Not allowed"]);
    facts.push(["In and out", listing.inAndOut ? "Allowed" : "Not during the booking"]);
    facts.push(["Cover", listing.covered ? "Covered" : "Uncovered"]);
  }
  if (listing.walkingNote) facts.push(["Location note", listing.walkingNote]);

  return (
    <article className="mx-auto max-w-6xl px-5 py-10">
      <p className="text-sm text-muted">
        <Link href="/find" className="quiet-link">Find Space</Link>
        <span> / {listing.category === "storage" ? "Storage" : "Parking"}</span>
      </p>
      <div className="mt-4 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem]">
            <Image src={listing.image} alt={listing.imageAlt} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 70vw" />
            <div className="absolute right-4 top-4">
              <FavoriteButton id={listing.id} />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.14em] text-muted">
            <span className="rounded-full bg-sage-soft px-3 py-1 text-forest">{listing.category}</span>
            <span>{listing.neighborhood}</span>
            <span>Fictional demo</span>
          </div>
          <h1 className="display mt-3 text-4xl text-forest md:text-5xl">{listing.title}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-charcoal">{listing.description}</p>
          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            {facts.map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-line bg-paper px-4 py-3">
                <dt className="text-xs uppercase tracking-[0.14em] text-muted">{label}</dt>
                <dd className="mt-1 text-charcoal">{value}</dd>
              </div>
            ))}
          </dl>
          <section className="mt-8">
            <h2 className="display text-2xl text-forest">Good to know</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-charcoal">
              {listing.restrictions.map((item) => (
                <li key={item}>{item}</li>
              ))}
              {listing.allowedItems ? <li>Items the host described as welcome: {listing.allowedItems.join(", ")}.</li> : null}
            </ul>
          </section>
          <aside className="mt-8 rounded-3xl bg-warm px-5 py-4 text-sm leading-6">
            <p className="text-xs uppercase tracking-[0.14em] text-gold">Host</p>
            <p className="mt-2 text-forest">{listing.hostLabel}</p>
            <p className="text-muted">Not a real person. This space is not verified, and the photo is a stock stand-in.</p>
          </aside>
          <p className="mt-6 text-sm text-muted">{listing.availability.notes}</p>
        </div>
        <BookingPanel listing={listing} />
      </div>
    </article>
  );
}
