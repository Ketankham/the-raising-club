import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import { requireAdmin } from "@/lib/guards";
import { getCourseForEdit, getCourseTaxonomy } from "@/lib/courses/admin";
import { CourseEditor } from "@/components/courses/admin/course-editor";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [initial, taxonomy] = await Promise.all([getCourseForEdit(id), getCourseTaxonomy()]);
  if (!initial) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/admin/courses" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
          <ArrowLeft size={16} /> Back to courses
        </Link>
        <a
          href={`/admin/courses/${id}/preview`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink-soft hover:text-ink"
          title="Preview the course as a learner (admin only)"
        >
          <Eye size={15} /> Preview
        </a>
      </div>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">Edit course</h1>
      <CourseEditor initial={initial} taxonomy={taxonomy} />
    </div>
  );
}
