import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { JobForm } from "@/components/marketplace/job-form";
import { getSkillsList, getMyOrgOptions } from "@/lib/marketplace/jobs";

export default async function NewJobPage() {
  const [skills, orgs] = await Promise.all([getSkillsList(), getMyOrgOptions()]);
  return (
    <div>
      <Link href="/dashboard/posts" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> My Care Posts
      </Link>
      <h1 className="mb-6 font-display text-3xl font-bold text-ink">Post a job</h1>
      <JobForm skillOptions={skills} orgOptions={orgs} />
    </div>
  );
}
