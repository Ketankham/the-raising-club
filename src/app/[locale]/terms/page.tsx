import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TermsContent } from "@/components/legal/terms-content";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: "termsPage" });
  return {
    title: t("meta_title"),
    description: t("meta_description"),
  };
}

export default async function TermsPage() {
  const t = await getTranslations("termsPage");

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-3xl px-5 py-16 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">{t("header_label")}</p>
            <h1 className="mt-2 font-display text-4xl font-bold text-ink">{t("header_title")}</h1>
            <p className="mt-3 text-sm text-ink/60">{t("header_effective")} · {t("header_updated")}</p>
            <p className="mt-6 text-ink/80">
              {t("header_intro")}
            </p>
          </div>

          <TermsContent />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
