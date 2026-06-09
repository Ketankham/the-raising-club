import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { JobForm } from "@/components/marketplace/job-form";
import { getJobForEdit, getSkillsList, getMyOrgOptions } from "@/lib/marketplace/jobs";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [job, skills, orgs] = await Promise.all([getJobForEdit(id), getSkillsList(), getMyOrgOptions()]);
  if (!job) notFound();

  return (
    <div>
      <Link href="/dashboard/posts" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> My Care Posts
      </Link>
      <h1 className="mb-6 font-display text-3xl font-bold text-ink">Edit job</h1>
      <JobForm initial={job} jobId={id} skillOptions={skills} orgOptions={orgs} />
    </div>
  );
}
