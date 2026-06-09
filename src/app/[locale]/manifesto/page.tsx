import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Manifesto } from "@/components/about/manifesto";

export const metadata: Metadata = {
  title: "Our Manifesto — The Raising Club",
  description:
    "A new standard, where care is education. We’re building modern infrastructure for childhood—a global club where every adult around a child belongs.",
};

export default function ManifestoPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Manifesto />
      </main>
      <SiteFooter />
    </>
  );
}
