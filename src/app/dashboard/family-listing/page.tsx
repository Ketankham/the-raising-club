import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMyFamilyListing, getTraitOptions } from "@/lib/marketplace/family";
import { FamilyListingForm } from "@/components/marketplace/family-listing-form";

export default async function FamilyListingPage() {
  const [initial, traits] = await Promise.all([getMyFamilyListing(), getTraitOptions()]);

  return (
    <div>
      <Link href="/connect/families" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Connect Families
      </Link>
      <h1 className="font-display text-3xl font-bold text-ink">Your family listing</h1>
      <p className="mb-6 mt-1.5 text-ink-soft">Share what you&apos;re looking for so other families can connect with you.</p>
      <FamilyListingForm initial={initial} traitOptions={traits} />
    </div>
  );
}
