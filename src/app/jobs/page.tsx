import { Search } from "lucide-react";
import { requireOnboardedForMarketplace } from "@/lib/guards";
import { MarketplaceFilters } from "@/components/marketplace/marketplace-filters";
import { JobCard } from "@/components/marketplace/job-card";
import { listOpenJobs } from "@/lib/marketplace/jobs";
import { parseMarketplaceFilters } from "@/lib/marketplace/format";

/** Find Jobs — caregivers browse + apply to open jobs. */
export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { profile } = await requireOnboardedForMarketplace();
  const sp = await searchParams;
  const filters = parseMarketplaceFilters(sp);
  const jobs = await listOpenJobs(filters);
  const canApply = profile.role === "caregiver";

  const hidden: { name: string; value: string }[] = [];
  for (const k of ["care", "ageMax", "where"]) {
    const v = sp[k];
    const val = Array.isArray(v) ? v[0] : v;
    if (val) hidden.push({ name: k, value: val });
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-ink lg:text-4xl">Find Jobs</h1>
        <p className="mt-1.5 text-ink-soft">Discover childcare jobs from families and programs near you</p>

        <form action="/jobs" method="get" className="mt-5 max-w-xl">
          {hidden.map((h) => (
            <input key={h.name} type="hidden" name={h.name} value={h.value} />
          ))}
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft/60" />
            <input type="search" name="q" defaultValue={filters.q ?? ""} placeholder="Search jobs..."
              className="w-full rounded-full border border-ink/15 bg-white py-3 pl-11 pr-4 text-sm text-ink shadow-sm outline-none focus:border-olive" />
          </div>
        </form>
      </header>

      <div className="lg:flex lg:gap-7">
        <MarketplaceFilters initial={filters} basePath="/jobs" />

        <div className="min-w-0 flex-1">
          <p className="mb-4 text-sm text-ink-soft">
            <span className="rounded-full bg-mint px-2.5 py-0.5 font-semibold text-ink">{jobs.length}</span>{" "}
            {jobs.length === 1 ? "job" : "jobs"} · Matched to your search and filters
          </p>

          {jobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/15 bg-white/50 p-12 text-center">
              <p className="font-display text-lg font-bold text-ink">No jobs found</p>
              <p className="mt-1 text-sm text-ink-soft">Try adjusting your filters or check back soon for new postings.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {jobs.map((j) => (
                <JobCard key={j.id} job={j} canApply={canApply} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
