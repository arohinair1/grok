"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { href: "/find", label: "Find Space" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/host", label: "List Your Space" },
  { href: "/bookings", label: "My Bookings" },
  { href: "/account", label: "Account" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-forest font-display text-lg text-cream">C</span>
          <span>
            <span className="display block text-lg leading-none text-forest">College Space</span>
            <span className="mt-1 block text-[11px] uppercase tracking-[0.18em] text-muted">Yale</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-charcoal md:flex" aria-label="Primary">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-forest">
              {link.label}
            </Link>
          ))}
          <Link href="/spacematch" className="rounded-full bg-forest px-4 py-2 text-cream transition hover:bg-forest-deep">
            Find My Space
          </Link>
        </nav>
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full border border-line md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      {open ? (
        <nav id="mobile-nav" className="border-t border-line px-5 py-4 md:hidden" aria-label="Mobile">
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="py-1">
                {link.label}
              </Link>
            ))}
            <Link
              href="/spacematch"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-forest px-4 py-3 text-center text-cream"
            >
              Find My Space
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
