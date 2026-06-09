import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/guards";
import { NewCourseForm } from "@/components/courses/admin/new-course-form";

export default async function NewCoursePage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/courses" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft size={16} /> Back to courses
      </Link>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">Create course</h1>
      <NewCourseForm />
    </div>
  );
}
