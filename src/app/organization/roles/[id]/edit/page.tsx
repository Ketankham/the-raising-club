import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { JobForm } from "@/components/marketplace/job-form";
import { getJobForEdit, getSkillsList } from "@/lib/marketplace/jobs";
import { requireUserProfile } from "@/lib/guards";
import { getOrgProfileForUser } from "@/lib/org-profile";

export default async function EditOrgRolePage({ params }: { params: Promise<{ id: string }> }) {
  const { user, profile } = await requireUserProfile();
  if (profile.role !== "organization") redirect("/dashboard");

  const orgData = await getOrgProfileForUser(user.id);
  if (!orgData) redirect("/onboarding");

  const { id } = await params;
  const [job, skills] = await Promise.all([getJobForEdit(id), getSkillsList()]);
  if (!job) notFound();

  const orgOptions = [{ id: orgData.orgId, name: orgData.name }];

  return (
    <div>
      <Link href="/organization/roles" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Open Roles
      </Link>
      <h1 className="mb-6 font-display text-3xl font-bold text-ink">Edit role</h1>
      <JobForm initial={job} jobId={id} skillOptions={skills} orgOptions={orgOptions} backHref="/organization/roles" />
    </div>
  );
}
