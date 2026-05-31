import { Search } from "lucide-react";
import { requireOnboardedProfile } from "@/lib/guards";
import { MarketplaceFilters } from "@/components/marketplace/marketplace-filters";
import { CaregiverCard } from "@/components/marketplace/caregiver-card";
import { listCaregivers } from "@/lib/marketplace/caregivers";
import { getMyJobOptions } from "@/lib/marketplace/jobs";
import { parseMarketplaceFilters } from "@/lib/marketplace/format";

/** Find Caregivers (Figma slides 1–2): browse + filter published caregivers,
 *  with the role-aware Invite (co-hire) action. */
export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { profile } = await requireOnboardedProfile();
  const sp = await searchParams;
  const filters = parseMarketplaceFilters(sp);

  const canInvite = profile.role === "parent" || profile.role === "organization";
  const [caregivers, jobs] = await Promise.all([
    listCaregivers(filters),
    canInvite ? getMyJobOptions() : Promise.resolve([]),
  ]);

  const hidden: { name: string; value: string }[] = [];
  for (const k of ["care", "ageMax", "where"]) {
    const v = sp[k];
    const val = Array.isArray(v) ? v[0] : v;
    if (val) hidden.push({ name: k, value: val });
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-ink lg:text-4xl">Find Caregivers</h1>
        <p className="mt-1.5 text-ink-soft">Browse and connect with qualified childcare professionals</p>

        <form action="/connect" method="get" className="mt-5 max-w-xl">
          {hidden.map((h) => (
            <input key={h.name} type="hidden" name={h.name} value={h.value} />
          ))}
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft/60" />
            <input
              type="search"
              name="q"
              defaultValue={filters.q ?? ""}
              placeholder="Search caregivers..."
              className="w-full rounded-full border border-ink/15 bg-white py-3 pl-11 pr-4 text-sm text-ink shadow-sm outline-none focus:border-olive"
            />
          </div>
        </form>
      </header>

      <div className="lg:flex lg:gap-7">
        <MarketplaceFilters initial={filters} basePath="/connect" />

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-ink-soft">
              <span className="rounded-full bg-mint px-2.5 py-0.5 font-semibold text-ink">{caregivers.length}</span>{" "}
              {caregivers.length === 1 ? "caregiver" : "caregivers"} · Matched to your search and filters
            </p>
          </div>

          {caregivers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/15 bg-white/50 p-12 text-center">
              <p className="font-display text-lg font-bold text-ink">No caregivers found</p>
              <p className="mt-1 text-sm text-ink-soft">Try adjusting your filters or check back soon.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {caregivers.map((c) => (
                <CaregiverCard key={c.userId} c={c} canInvite={canInvite} jobs={jobs} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
