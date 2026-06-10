import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TranslatingMembership } from "@/components/membership/translating-membership";
import { listTabs } from "@/lib/plans/queries";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: "membershipPage" });
  return {
    title: t("meta_title"),
    description: t("meta_description"),
  };
}

export default async function MembershipPage() {
  const tabs = await listTabs();
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <TranslatingMembership tabs={tabs} />
      </main>
      <SiteFooter />
    </>
  );
}
