import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/guards";
import { listCoursesForBundlePicker } from "@/lib/courses/admin";
import { BundleForm } from "@/components/courses/admin/bundle-form";
import type { BundleInput } from "@/lib/courses/types";

const EMPTY: BundleInput = {
  id: null,
  title: "",
  summary: "",
  description: "",
  coverImageUrl: "",
  status: "draft",
  isFree: true,
  priceCents: 0,
  compareAtPriceCents: null,
  isFeatured: false,
  courseIds: [],
};

export default async function NewBundlePage() {
  await requireAdmin();
  const courses = await listCoursesForBundlePicker();
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/courses/bundles" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft size={16} /> Back to paths
      </Link>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">Create learning path</h1>
      <BundleForm initial={EMPTY} courses={courses} />
    </div>
  );
}
