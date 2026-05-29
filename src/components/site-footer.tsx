import Link from "next/link";
import { Logo } from "./logo";

const SOCIAL_PATHS: Record<string, string> = {
  Facebook:
    "M13.5 21v-7h2.3l.4-2.7h-2.7V9.5c0-.8.2-1.3 1.4-1.3h1.4V5.8c-.7-.1-1.4-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.6v2H8.3V14h2.3v7h2.9Z",
  Instagram:
    "M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2Zm0 7.9A3.1 3.1 0 1 1 12 8.9a3.1 3.1 0 0 1 0 6.2Zm6.1-8.1a1.1 1.1 0 1 1-2.3 0 1.1 1.1 0 0 1 2.3 0ZM21 6.9c-.1-1.5-.4-2.8-1.5-3.9S17.1 1.6 15.6 1.5C14 1.4 9.9 1.4 8.4 1.5c-1.5.1-2.8.4-3.9 1.5S2.6 5.4 2.5 6.9c-.1 1.6-.1 5.6 0 7.2.1 1.5.4 2.8 1.5 3.9s2.4 1.4 3.9 1.5c1.6.1 5.6.1 7.2 0 1.5-.1 2.8-.4 3.9-1.5s1.4-2.4 1.5-3.9c.1-1.6.1-5.6 0-7.2ZM18.9 15.8a3.1 3.1 0 0 1-1.8 1.8c-1.2.5-4.1.4-5.5.4s-4.3.1-5.5-.4a3.1 3.1 0 0 1-1.8-1.8c-.5-1.2-.4-4.1-.4-5.5s-.1-4.3.4-5.5A3.1 3.1 0 0 1 6.5 3.2C7.7 2.7 10.6 2.8 12 2.8s4.3-.1 5.5.4a3.1 3.1 0 0 1 1.8 1.8c.5 1.2.4 4.1.4 5.5s.1 4.3-.4 5.5Z",
  LinkedIn:
    "M6.9 20.5V9.4H3.2v11.1h3.7ZM5.1 7.9a2.1 2.1 0 1 0 0-4.3 2.1 2.1 0 0 0 0 4.3Zm15.4 12.6h-3.7v-5.4c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.5H9.2V9.4h3.5v1.5h.1c.5-.9 1.7-1.8 3.4-1.8 3.6 0 4.3 2.4 4.3 5.5v5.9Z",
  YouTube:
    "M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 14.8V9.2l5 2.8-5 2.8Z",
};

const SOCIALS = ["Facebook", "Instagram", "LinkedIn", "YouTube"];

const QUICK_LINKS = [
  { label: "About Us", href: "/about-us" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/#footer" },
  { label: "Trust & Safety", href: "/trust-safety" },
  { label: "Blog", href: "/blog" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
];

export function SiteFooter() {
  return (
    <footer id="footer" className="mt-auto bg-mint">
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.4fr]">
          {/* Brand */}
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-ink/70">
              Trusted by families and caregivers across the globe
            </p>
            <div className="mt-5 flex gap-3">
              {SOCIALS.map((label) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink/70 shadow-sm transition-colors hover:bg-primary hover:text-white"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d={SOCIAL_PATHS[label]} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
              Quick Links
            </h4>
            <ul className="mt-4 space-y-2.5">
              {QUICK_LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-ink/70 transition-colors hover:text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
              Newsletter
            </h4>
            <p className="mt-4 text-sm text-ink/70">
              Join The Raising Club community
            </p>
            <form className="mt-4 flex max-w-sm gap-2">
              <input
                type="email"
                required
                placeholder="Your email"
                className="min-w-0 flex-1 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-ink/40 focus:border-primary"
              />
              <button
                type="submit"
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-black/5 bg-mint">
        <div className="mx-auto max-w-7xl px-5 py-5 text-center text-xs text-ink/60 lg:px-8">
          The Raising Club is formed by The Raising Club Marketplace{" "}
          <a
            href="https://theraisingclub.com"
            className="italic text-primary hover:underline"
          >
            (theraisingclub.com)
          </a>{" "}
          and The Raising Club Foundation{" "}
          <a
            href="https://theraisingclub.org"
            className="italic text-primary hover:underline"
          >
            (theraisingclub.org)
          </a>
        </div>
      </div>
    </footer>
  );
}
