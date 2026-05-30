import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/guards";
import { getBundleForEdit, listCoursesForBundlePicker } from "@/lib/courses/admin";
import { BundleForm } from "@/components/courses/admin/bundle-form";

export default async function EditBundlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [initial, courses] = await Promise.all([
    getBundleForEdit(id),
    listCoursesForBundlePicker(),
  ]);
  if (!initial) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/courses/bundles" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft size={16} /> Back to paths
      </Link>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">Edit learning path</h1>
      <BundleForm initial={initial} courses={courses} />
    </div>
  );
}
