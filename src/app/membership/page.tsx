import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Membership } from "@/components/membership/membership";

export const metadata: Metadata = {
  title: "Membership — The Raising Club",
  description:
    "Choose the membership that matches your role with children—plans for caregivers and educators, families, and centers & programs.",
};

export default function MembershipPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Membership />
      </main>
      <SiteFooter />
    </>
  );
}
