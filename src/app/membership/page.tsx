import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Membership } from "@/components/membership/membership";
import { listTabs } from "@/lib/plans/queries";

export const metadata: Metadata = {
  title: "Membership — The Raising Club",
  description:
    "Choose the membership that matches your role with children—plans for caregivers and educators, families, and centers & programs.",
};

export default async function MembershipPage() {
  const tabs = await listTabs();
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Membership tabs={tabs} />
      </main>
      <SiteFooter />
    </>
  );
}
