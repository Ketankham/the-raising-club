import Link from "next/link";
import { Plus, Briefcase } from "lucide-react";
import { listMyJobs } from "@/lib/marketplace/jobs";
import { ManageJobRow } from "@/components/marketplace/manage-job-row";

/** My Care Posts — the jobs the current user has posted. */
export default async function MyPostsPage() {
  const jobs = await listMyJobs();

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">My Care Posts</h1>
          <p className="mt-1.5 text-ink-soft">Post jobs and invite caregivers to co-hire.</p>
        </div>
        <Link href="/dashboard/posts/new"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95">
          <Plus className="h-4 w-4" /> Post a job
        </Link>
      </header>

      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 bg-white/50 p-12 text-center">
          <Briefcase className="mx-auto h-8 w-8 text-ink-soft/50" />
          <p className="mt-3 font-display text-lg font-bold text-ink">No jobs yet</p>
          <p className="mt-1 text-sm text-ink-soft">Post your first job to start inviting caregivers.</p>
          <Link href="/dashboard/posts/new" className="mt-4 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">
            Post a job
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((j) => (
            <ManageJobRow key={j.id} job={j} />
          ))}
        </div>
      )}
    </div>
  );
}
