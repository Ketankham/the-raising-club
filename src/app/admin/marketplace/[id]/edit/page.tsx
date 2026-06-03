import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/guards";
import { getJobForEdit, getSkillsList } from "@/lib/marketplace/jobs";
import { JobForm } from "@/components/marketplace/job-form";

export default async function AdminEditJobPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [job, skills] = await Promise.all([getJobForEdit(id), getSkillsList()]);
  if (!job) notFound();

  return (
    <div>
      <Link href={`/admin/marketplace/${id}`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to job
      </Link>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">Edit job</h1>
      <JobForm initial={job} jobId={id} skillOptions={skills} orgOptions={[]} backHref={`/admin/marketplace/${id}`} />
    </div>
  );
}
