import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getJobApplicants } from "@/lib/marketplace/jobs";
import { ApplicantRow } from "@/components/marketplace/applicant-row";
import { requireUserProfile } from "@/lib/guards";

export default async function OrgRoleApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireUserProfile();
  if (profile.role !== "organization") redirect("/dashboard");

  const { id } = await params;
  const data = await getJobApplicants(id);
  if (!data) notFound();

  return (
    <div>
      <Link href="/organization/roles" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Open Roles
      </Link>
      <h1 className="font-display text-3xl font-bold text-ink">Applicants</h1>
      <p className="mt-1.5 text-ink-soft">{data.title}</p>

      <div className="mt-6 space-y-3">
        {data.applicants.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink/15 bg-white/50 p-12 text-center">
            <p className="font-display text-lg font-bold text-ink">No applicants yet</p>
            <p className="mt-1 text-sm text-ink-soft">
              Caregivers who apply will appear here. You can also invite caregivers from Find Staff.
            </p>
          </div>
        ) : (
          data.applicants.map((a) => <ApplicantRow key={a.applicationId} a={a} />)
        )}
      </div>
    </div>
  );
}
