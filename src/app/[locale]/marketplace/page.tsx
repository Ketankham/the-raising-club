import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MarketplaceContent } from "@/components/marketplace-landing/marketplace-content";

export const metadata: Metadata = {
  title: "Marketplace — The Raising Club",
  description:
    "One marketplace connecting caregivers seeking opportunities, parents finding trusted care, and organisations building their teams — plus the community, courses and events that tie it all together.",
};

export default function MarketplacePage() {
  return (
    <>
      <SiteHeader />
      <MarketplaceContent />
      <SiteFooter />
    </>
  );
}
