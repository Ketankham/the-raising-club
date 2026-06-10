import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AboutHero } from "@/components/about/about-hero";
import { Founder } from "@/components/about/founder";
import { Values } from "@/components/about/values";
import { AboutCta } from "@/components/about/about-cta";
import { Flower } from "@/components/about/star-burst";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: "aboutPage" });
  return {
    title: t("meta_title"),
    description: t("meta_description"),
  };
}

export default async function AboutUsPage() {
  const t = await getTranslations("about");
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <AboutHero />
        <Founder />

        {/* quote band */}
        <section className="relative overflow-hidden bg-lavender px-5 py-12 sm:py-16">
          <Flower className="pointer-events-none absolute -left-6 bottom-2 h-28 w-28 text-white/60" />
          <Flower className="pointer-events-none absolute right-6 top-3 h-16 w-16 text-white/60" />
          <Flower className="pointer-events-none absolute -right-4 bottom-4 h-24 w-24 text-white/50" />
          <div className="relative mx-auto max-w-5xl rounded-[2.5rem] bg-cream px-6 py-14 text-center sm:py-16">
            <p className="font-serif text-2xl font-medium leading-snug text-ink sm:text-3xl lg:text-[2.5rem]">
              &ldquo;{t("quoteLead")}
              <span className="rounded-[0.4em] bg-purple/25 px-2 italic [box-decoration-break:clone]">
                {t("quoteAccent")}
              </span>
              &rdquo;
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
