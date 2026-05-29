import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Manifesto } from "@/components/about/manifesto";

export const metadata: Metadata = {
  title: "Our Manifesto — The Raising Club",
  description:
    "We’re building modern infrastructure for childhood—a global club where care is education. Read The Raising Club manifesto.",
};

export default function ManifestoPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Manifesto />

        {/* join CTA */}
        <section className="bg-lavender/50 pb-24 text-center">
          <Link
            href="/get-started"
            className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
          >
            Join the Club
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
