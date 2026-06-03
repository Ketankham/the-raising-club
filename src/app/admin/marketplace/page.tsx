import Link from "next/link";
import { Plus, Briefcase, Users } from "lucide-react";
import { requireAdmin } from "@/lib/guards";
import { listAllJobPosts } from "@/lib/marketplace/jobs";

const STATUS_STYLE: Record<string, string> = {
  open: "bg-olive/20 text-olive",
  draft: "border border-ink/15 text-ink-soft",
  closed: "bg-ink/10 text-ink-soft",
  filled: "bg-purple/20 text-purple",
};

export default async function AdminMarketplacePage() {
  await requireAdmin();
  const jobs = await listAllJobPosts();

  const stats = {
    total: jobs.length,
    open: jobs.filter((j) => j.status === "open").length,
    totalApplicants: jobs.reduce((s, j) => s + (j.applicantCount ?? 0), 0),
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Marketplace</h1>
          <p className="text-sm text-ink-soft">All care posts and job applications across the platform.</p>
        </div>
        <Link
          href="/admin/marketplace/new"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          <Plus size={16} /> Post a job
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: "Total posts", value: stats.total },
          { label: "Active (open)", value: stats.open },
          { label: "Total applicants", value: stats.totalApplicants },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-ink">{s.value}</p>
            <p className="text-sm text-ink-soft">{s.label}</p>
          </div>
        ))}
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 bg-white/50 p-12 text-center">
          <Briefcase className="mx-auto h-8 w-8 text-ink-soft/50" />
          <p className="mt-3 font-display text-lg font-bold text-ink">No jobs posted yet</p>
          <Link href="/admin/marketplace/new" className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white">
            Post the first job
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-cream/60 text-left text-xs font-semibold uppercase text-ink-soft">
              <tr>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Posted by</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Applicants</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {jobs.map((j) => (
                <tr key={j.id} className="hover:bg-cream/40">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{j.title}</p>
                    {j.careType && <p className="text-xs text-ink-soft capitalize">{j.careType.replace(/_/g, " ")}</p>}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    <p className="font-medium text-ink">{j.orgName ?? j.ownerName ?? "—"}</p>
                    {j.orgName && j.ownerName && <p className="text-xs">{j.ownerName}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[j.status] ?? "bg-ink/10 text-ink-soft"}`}>
                      {j.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{j.locationLabel ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-ink">
                      <Users size={14} className="text-ink-soft" /> {j.applicantCount ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link href={`/admin/marketplace/${j.id}`} className="font-semibold text-primary hover:underline">
                      View
                    </Link>
                    <span className="mx-2 text-ink-soft/40">·</span>
                    <Link href={`/admin/marketplace/${j.id}/edit`} className="font-semibold text-ink-soft hover:text-ink">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
