import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Briefcase } from "lucide-react";
import { requireUserProfile } from "@/lib/guards";
import { getOrgProfileForUser } from "@/lib/org-profile";
import { listOrgJobPosts } from "@/lib/marketplace/jobs";
import { ManageJobRow } from "@/components/marketplace/manage-job-row";

export default async function OrgRolesPage() {
  const { user, profile } = await requireUserProfile();
  if (profile.role !== "organization") redirect("/dashboard");

  const orgData = await getOrgProfileForUser(user.id);
  if (!orgData) redirect("/onboarding");

  const jobs = await listOrgJobPosts(orgData.orgId);

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Open Roles</h1>
          <p className="mt-1.5 text-ink-soft">Post staff openings and manage applications from caregivers.</p>
        </div>
        <Link
          href={`/organization/roles/new`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
        >
          <Plus className="h-4 w-4" /> Post a role
        </Link>
      </header>

      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 bg-white/50 p-12 text-center">
          <Briefcase className="mx-auto h-8 w-8 text-ink-soft/50" />
          <p className="mt-3 font-display text-lg font-bold text-ink">No roles posted yet</p>
          <p className="mt-1 text-sm text-ink-soft">
            Post your first opening to start receiving applications from qualified caregivers.
          </p>
          <Link
            href="/organization/roles/new"
            className="mt-4 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white"
          >
            Post a role
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((j) => (
            <ManageJobRow key={j.id} job={j} basePath="/organization/roles" />
          ))}
        </div>
      )}
    </div>
  );
}
