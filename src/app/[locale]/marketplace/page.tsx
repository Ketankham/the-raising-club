import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MarketplaceContent } from "@/components/marketplace-landing/marketplace-content";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: "marketplacePage" });
  return {
    title: t("meta_title"),
    description: t("meta_description"),
  };
}

export default function MarketplacePage() {
  return (
    <>
      <SiteHeader />
      <MarketplaceContent />
      <SiteFooter />
    </>
  );
}
