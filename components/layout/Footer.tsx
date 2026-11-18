import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-forest-deep text-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="display text-2xl">College Space — Yale</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-sage-soft/90">
            A little more space for life at Yale. Storage and parking, matched with Grok SpaceMatch.
          </p>
        </div>
        <div className="text-sm leading-7">
          <p className="text-xs uppercase tracking-[0.16em] text-sage">Explore</p>
          <Link className="block hover:text-white" href="/find">Find Space</Link>
          <Link className="block hover:text-white" href="/spacematch">Grok SpaceMatch</Link>
          <Link className="block hover:text-white" href="/host">List your space</Link>
          <Link className="block hover:text-white" href="/how-it-works">How it works</Link>
        </div>
        <div className="text-sm leading-6 text-sage-soft/90">
          <p className="text-xs uppercase tracking-[0.16em] text-sage">Demo</p>
          <p className="mt-2">
            Listings, hosts, prices, and dates are fictional. Photos are stock illustrations, not the spaces themselves.
            Nothing here is verified, booked, or affiliated with Yale University.
          </p>
        </div>
      </div>
    </footer>
  );
}
