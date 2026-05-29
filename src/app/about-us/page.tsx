import type { Metadata } from "next";
import Image from "next/image";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AboutHero } from "@/components/about/about-hero";
import { Founder } from "@/components/about/founder";
import { Values } from "@/components/about/values";
import { AboutCta } from "@/components/about/about-cta";

export const metadata: Metadata = {
  title: "About Us — The Raising Club",
  description:
    "We’re building the modern village for families—bringing families, caregivers, and programs together with evidence-based guidance. Meet our founder and read our manifesto.",
};

export default function AboutUsPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <AboutHero />
        <Founder />

        {/* quote band */}
        <section className="relative">
          <Image
            src="/images/quote-band.png"
            alt=""
            width={1068}
            height={187}
            className="h-40 w-full object-cover sm:h-48 lg:h-56"
          />
          <div className="absolute inset-0 grid place-items-center px-5 text-center">
            <p className="font-serif text-2xl font-medium leading-snug text-ink sm:text-3xl lg:text-[2.5rem]">
              &ldquo;When families rise,{" "}
              <span className="italic text-primary">society rises.</span>&rdquo;
            </p>
          </div>
        </section>

        <Values />
        <AboutCta />
      </main>
      <SiteFooter />
    </>
  );
}
