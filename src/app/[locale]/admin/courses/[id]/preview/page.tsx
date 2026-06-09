import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { getCourseForEdit } from "@/lib/courses/admin";
import type { QuizInput } from "@/lib/courses/types";
import { CoursePreview } from "@/components/courses/course-preview";

// Always render the latest course content — never a cached (pre-edit) snapshot.
export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
// Focused quiz read. getCourseForEdit's single deeply-nested query can drop the
// quiz branch, so fetch it on its own here (admin RLS allows the read).
async function getQuizForPreview(courseId: string): Promise<QuizInput | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("course_quizzes")
    .select(
      `intro_copy, pass_threshold,
       course_quiz_questions (
         id, prompt, position,
         course_quiz_options ( id, body, explanation, is_correct, position )
       )`,
    )
    .eq("course_id", courseId)
    .maybeSingle();
  if (!data) return null;
  return {
    introCopy: data.intro_copy ?? "",
    passThreshold: data.pass_threshold ?? 60,
    questions: (data.course_quiz_questions ?? [])
      .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
      .map((q: any) => ({
        id: q.id,
        prompt: q.prompt ?? "",
        options: (q.course_quiz_options ?? [])
          .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
          .map((o: any) => ({
            id: o.id,
            body: o.body ?? "",
            explanation: o.explanation ?? "",
            isCorrect: o.is_correct ?? false,
            position: o.position ?? 0,
          })),
      })),
  };
}

/** Admin-only learner-experience preview of a course (lessons, revision, quiz). */
export default async function CoursePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const course = await getCourseForEdit(id);
  if (!course) notFound();

  // Use the focused quiz read (more reliable than the big editor query above).
  course.quiz = await getQuizForPreview(id);

  return (
    <div>
      <div className="mx-auto mb-2 max-w-6xl px-4 lg:px-6">
        <Link href="/admin/courses" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
          <ArrowLeft size={16} /> Back to courses
        </Link>
      </div>
      <CoursePreview course={course} />
    </div>
  );
}
