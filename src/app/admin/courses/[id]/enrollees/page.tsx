import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { getCourseEnrollees } from "@/lib/courses/admin";
import { EnrolleesView } from "@/components/courses/admin/enrollees-view";

export default async function CourseEnrolleesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id, title")
    .eq("id", id)
    .maybeSingle();
  if (!course) notFound();

  const enrollees = await getCourseEnrollees(id);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/courses"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={16} /> Back to courses
      </Link>
      <h1 className="font-display text-2xl font-bold text-ink">{course.title}</h1>
      <p className="mb-6 text-sm text-ink-soft">Enrollees &amp; purchases</p>
      <EnrolleesView enrollees={enrollees} courseId={id} />
    </div>
  );
}
