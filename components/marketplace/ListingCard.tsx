import Image from "next/image";
import Link from "next/link";
import { priceLabel } from "@/lib/format";
import type { Listing } from "@/types/marketplace";
import { FavoriteButton } from "@/components/marketplace/FavoriteButton";

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-paper shadow-[0_18px_40px_rgba(36,48,43,0.05)]">
      <div className="absolute right-3 top-3 z-10">
        <FavoriteButton id={listing.id} />
      </div>
      <Link href={`/listings/${listing.id}`} className="relative block aspect-[4/3] overflow-hidden">
        <Image
          src={listing.image}
          alt={listing.imageAlt}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.14em] text-muted">
          <span>{listing.category === "storage" ? "Storage" : "Parking"}</span>
          <span>{listing.neighborhood}</span>
        </div>
        <h3 className="display mt-3 text-2xl leading-tight text-forest">
          <Link href={`/listings/${listing.id}`}>{listing.title}</Link>
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{listing.description}</p>
        <div className="mt-5 flex items-end justify-between gap-3">
          <p className="text-lg text-charcoal">
            {priceLabel(listing)}
            <span className="mt-1 block text-xs text-muted">Illustrative demo price</span>
          </p>
          <Link href={`/listings/${listing.id}`} className="text-sm text-forest underline decoration-sage underline-offset-4">
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
