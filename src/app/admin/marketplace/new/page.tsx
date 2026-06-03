import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/guards";
import { getSkillsList } from "@/lib/marketplace/jobs";
import { JobForm } from "@/components/marketplace/job-form";

export default async function AdminNewJobPage() {
  await requireAdmin();
  const skills = await getSkillsList();

  return (
    <div>
      <Link href="/admin/marketplace" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Marketplace
      </Link>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">Post a job</h1>
      <JobForm skillOptions={skills} orgOptions={[]} backHref="/admin/marketplace" />
    </div>
  );
}
