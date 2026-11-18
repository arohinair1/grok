import Image from "next/image";
import Link from "next/link";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { EXAMPLE_PROMPTS, PARKING_DEMO, STORAGE_DEMO } from "@/data/prompts";
import { listings } from "@/data/listings";

const featured = listings.filter((listing) => listing.featured);

export default function HomePage() {
  return (
    <div>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">College Space — Yale</p>
          <h1 className="display mt-4 text-5xl leading-[1.05] text-forest md:text-7xl">
            A little more space for life at Yale.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-charcoal">
            Find affordable storage and parking around Yale. Tell Grok what you need, and we&apos;ll help you find the right fit.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/spacematch" className="rounded-full bg-forest px-6 py-3 text-cream transition hover:bg-forest-deep">
              Find My Space
            </Link>
            <Link href="/find" className="rounded-full border border-forest px-6 py-3 text-forest">
              Explore Listings
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative col-span-2 aspect-[16/10] overflow-hidden rounded-[2rem]">
            <Image src="/images/campus.jpg" alt="Stock photo of a university building, used as atmosphere for the Yale demo." fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
          </div>
          <div className="relative aspect-square overflow-hidden rounded-[1.5rem]">
            <Image src="/images/closet.jpg" alt="Stock photo of an organized closet, illustrating student storage." fill className="object-cover" sizes="25vw" />
          </div>
          <div className="relative aspect-square overflow-hidden rounded-[1.5rem]">
            <Image src="/images/driveway.jpg" alt="Stock photo of a residential driveway, illustrating private parking." fill className="object-cover" sizes="25vw" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 md:grid-cols-2">
        <Link href="/find?category=storage" className="group relative min-h-72 overflow-hidden rounded-[2rem]">
          <Image src="/images/shelves.jpg" alt="Stock photo of storage shelves." fill className="object-cover transition duration-500 group-hover:scale-[1.03]" sizes="50vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/85 via-forest-deep/20 to-transparent" />
          <div className="absolute bottom-0 p-7 text-cream">
            <h2 className="display text-4xl">Find Storage</h2>
            <p className="mt-2 max-w-sm text-sage-soft">Heading home for the summer? Find a place for the things you can&apos;t take with you.</p>
          </div>
        </Link>
        <Link href="/find?category=parking" className="group relative min-h-72 overflow-hidden rounded-[2rem]">
          <Image src="/images/house.jpg" alt="Stock photo of a house with a driveway." fill className="object-cover transition duration-500 group-hover:scale-[1.03]" sizes="50vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/85 via-forest-deep/20 to-transparent" />
          <div className="absolute bottom-0 p-7 text-cream">
            <h2 className="display text-4xl">Find Parking</h2>
            <p className="mt-2 max-w-sm text-sage-soft">Coming to Yale for graduation, game day, or the semester? Find convenient parking near campus.</p>
          </div>
        </Link>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gold">Around New Haven</p>
            <h2 className="display mt-2 text-4xl text-forest">Featured spaces</h2>
          </div>
          <Link href="/find" className="text-sm text-forest underline underline-offset-4">See all</Link>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {featured.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5">
        <div className="rounded-[2rem] bg-forest px-6 py-10 text-cream md:px-10">
          <p className="text-xs uppercase tracking-[0.18em] text-sage">Grok SpaceMatch</p>
          <h2 className="display mt-3 max-w-2xl text-4xl md:text-5xl">Tell us what you need. Grok will help find a space that fits.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Link href={`/spacematch?prompt=${encodeURIComponent(STORAGE_DEMO)}`} className="rounded-3xl bg-white/10 p-5 transition hover:bg-white/15">
              <p className="text-xs uppercase tracking-[0.14em] text-sage">Storage</p>
              <p className="mt-3 leading-7">{STORAGE_DEMO}</p>
            </Link>
            <Link href={`/spacematch?prompt=${encodeURIComponent(PARKING_DEMO)}`} className="rounded-3xl bg-white/10 p-5 transition hover:bg-white/15">
              <p className="text-xs uppercase tracking-[0.14em] text-sage">Parking</p>
              <p className="mt-3 leading-7">{PARKING_DEMO}</p>
            </Link>
          </div>
          <Link href="/spacematch" className="mt-6 inline-flex rounded-full bg-cream px-5 py-3 text-forest">Open SpaceMatch</Link>
        </div>
      </section>

      <section id="how" className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-3">
        {[
          ["01", "Describe the stay", "Boxes and a mini-fridge, or an SUV from Saturday morning through Monday afternoon."],
          ["02", "See the fit", "Grok extracts the constraints. The catalog drops anything that cannot actually work."],
          ["03", "Review the space", "Open the listing, read the limits, and send a simulated request."],
        ].map(([step, title, body]) => (
          <div key={step}>
            <p className="text-xs uppercase tracking-[0.16em] text-gold">{step}</p>
            <h2 className="display mt-2 text-3xl text-forest">{title}</h2>
            <p className="mt-3 leading-7 text-muted">{body}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-5">
        <div className="grid gap-6 rounded-[2rem] border border-line bg-paper p-6 md:grid-cols-[0.8fr_1.2fr] md:p-8">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gold">Event parking</p>
            <h2 className="display mt-2 text-4xl text-forest">Graduation weekend, game day, or just a busy week.</h2>
            <p className="mt-4 leading-7 text-muted">Visitors need a legal place to leave a car. Students with an unused driveway can offer it, if they actually have the authority. The demo dates are examples, not Yale&apos;s official calendar.</p>
          </div>
          <div className="grid gap-3">
            {EXAMPLE_PROMPTS.filter((prompt) => prompt.category === "parking").slice(0, 3).map((prompt) => (
              <Link key={prompt.id} href={`/spacematch?prompt=${encodeURIComponent(prompt.text)}`} className="rounded-2xl bg-cream px-4 py-3 text-sm leading-6 text-forest">
                {prompt.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-16 md:grid-cols-3">
        {[
          ["Breaks and moves", "Summer, winter, study abroad, and the week between apartments."],
          ["A price you can read", "Monthly storage, and parking by the hour, day, event, or month. Totals follow the stay, not a raw rate."],
          ["Honest limits", "If a closet cannot take a mini-fridge, or a pad cannot take an SUV overnight, it is not recommended."],
        ].map(([title, body]) => (
          <article key={title} className="rounded-3xl border border-line bg-paper p-6">
            <h2 className="display text-2xl text-forest">{title}</h2>
            <p className="mt-3 leading-7 text-muted">{body}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-8">
        <div className="overflow-hidden rounded-[2rem] bg-sage-soft md:grid md:grid-cols-2">
          <div className="p-8 md:p-10">
            <h2 className="display text-4xl text-forest">Have a little extra room or an unused driveway?</h2>
            <p className="mt-4 leading-7 text-charcoal">Put it to good use. Draft a storage or parking listing, then keep the preview on this browser until you are ready for a real marketplace.</p>
            <Link href="/host" className="mt-6 inline-flex rounded-full bg-forest px-5 py-3 text-cream">List your space</Link>
          </div>
          <div className="relative min-h-64">
            <Image src="/images/room.jpg" alt="Stock photo of a spare room that could hold boxes." fill className="object-cover" sizes="50vw" />
          </div>
        </div>
      </section>
    </div>
  );
}
