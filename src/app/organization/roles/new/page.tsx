import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { requireUserProfile } from "@/lib/guards";
import { getOrgProfileForUser } from "@/lib/org-profile";
import { getSkillsList } from "@/lib/marketplace/jobs";
import { JobForm } from "@/components/marketplace/job-form";

export default async function NewOrgRolePage() {
  const { user, profile } = await requireUserProfile();
  if (profile.role !== "organization") redirect("/dashboard");

  const orgData = await getOrgProfileForUser(user.id);
  if (!orgData) redirect("/onboarding");

  const skills = await getSkillsList();
  const orgOptions = [{ id: orgData.orgId, name: orgData.name }];

  return (
    <div>
      <Link
        href="/organization/roles"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Open Roles
      </Link>
      <h1 className="mb-6 font-display text-3xl font-bold text-ink">Post a role</h1>
      <JobForm
        skillOptions={skills}
        orgOptions={orgOptions}
        defaultOrgId={orgData.orgId}
        backHref="/organization/roles"
      />
    </div>
  );
}
