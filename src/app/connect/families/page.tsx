import Link from "next/link";
import { Search, Pencil } from "lucide-react";
import { requireOnboardedProfile } from "@/lib/guards";
import { MarketplaceFilters } from "@/components/marketplace/marketplace-filters";
import { FamilyCard } from "@/components/marketplace/family-card";
import { listFamilies } from "@/lib/marketplace/family";
import { parseMarketplaceFilters } from "@/lib/marketplace/format";

/** Connect Families (Figma slide 3): browse published family listings. */
export default async function FamiliesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { profile } = await requireOnboardedProfile();
  const sp = await searchParams;
  const filters = parseMarketplaceFilters(sp);
  const families = await listFamilies(filters);
  const canList = profile.role === "parent";

  const hidden: { name: string; value: string }[] = [];
  for (const k of ["care", "ageMax", "where"]) {
    const v = sp[k];
    const val = Array.isArray(v) ? v[0] : v;
    if (val) hidden.push({ name: k, value: val });
  }

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink lg:text-4xl">Connect Families</h1>
          <p className="mt-1.5 text-ink-soft">Connect with families looking to co-hire caregivers and build shared childcare support</p>
        </div>
        {canList && (
          <Link href="/dashboard/family-listing" className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-ink/15 bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-cream">
            <Pencil className="h-4 w-4" /> Edit your listing
          </Link>
        )}
      </header>

      <form action="/connect/families" method="get" className="mb-6 max-w-xl">
        {hidden.map((h) => (<input key={h.name} type="hidden" name={h.name} value={h.value} />))}
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft/60" />
          <input type="search" name="q" defaultValue={filters.q ?? ""} placeholder="Search families..."
            className="w-full rounded-full border border-ink/15 bg-white py-3 pl-11 pr-4 text-sm text-ink shadow-sm outline-none focus:border-olive" />
        </div>
      </form>

      <div className="lg:flex lg:gap-7">
        <MarketplaceFilters initial={filters} basePath="/connect/families" />

        <div className="min-w-0 flex-1">
          <p className="mb-4 text-sm text-ink-soft">
            <span className="rounded-full bg-sage/50 px-2.5 py-0.5 font-semibold text-ink">{families.length}</span>{" "}
            {families.length === 1 ? "family" : "families"} · Matched to your search and filters
          </p>

          {families.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/15 bg-white/50 p-12 text-center">
              <p className="font-display text-lg font-bold text-ink">No families found</p>
              <p className="mt-1 text-sm text-ink-soft">
                {canList ? "Be the first — publish your family listing to connect with others." : "Try adjusting your filters or check back soon."}
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {families.map((f) => (
                <FamilyCard key={f.userId} f={f} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
