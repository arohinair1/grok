import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <p className="text-xs uppercase tracking-[0.16em] text-gold">Missing page</p>
      <h1 className="display mt-3 text-5xl text-forest">That space is not in the demo.</h1>
      <p className="mt-4 text-muted">The listing may have been a guess. The fictional catalog is still on Find Space.</p>
      <Link href="/find" className="mt-6 inline-flex rounded-full bg-forest px-5 py-3 text-cream">
        Browse listings
      </Link>
    </div>
  );
}
