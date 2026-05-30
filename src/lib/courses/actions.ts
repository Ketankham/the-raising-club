"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export type ActionResult =
  | { ok: true; data?: any }
  | { ok: false; reason: "unauthenticated" | "forbidden" | "error"; message?: string };

async function getUserAndEnrollment(courseId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, enrollmentId: null as string | null };
  const { data } = await supabase
    .from("course_enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();
  return { supabase, user, enrollmentId: data?.id ?? null };
}

/** Enroll the current user (free). Idempotent — re-enrolling is a no-op. */
export async function enrollInCourse(courseId: string, slug: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  const { error } = await supabase
    .from("course_enrollments")
    .insert({ user_id: user.id, course_id: courseId });
  // Unique violation => already enrolled, which is fine.
  if (error && !/duplicate key|unique/i.test(error.message)) {
    const forbidden = /row-level security|policy/i.test(error.message);
    return { ok: false, reason: forbidden ? "forbidden" : "error", message: error.message };
  }
  revalidatePath(`/courses/${slug}`);
  return { ok: true };
}

/** Mark a module complete for the current learner. */
export async function completeModule(courseId: string, slug: string, moduleId: string): Promise<ActionResult> {
  const { supabase, user, enrollmentId } = await getUserAndEnrollment(courseId);
  if (!user) return { ok: false, reason: "unauthenticated" };
  if (!enrollmentId) return { ok: false, reason: "forbidden", message: "Not enrolled" };

  const { error } = await supabase
    .from("course_module_progress")
    .upsert({ enrollment_id: enrollmentId, module_id: moduleId }, { onConflict: "enrollment_id,module_id" });
  if (error) return { ok: false, reason: "error", message: error.message };

  await supabase.from("course_enrollments").update({ last_activity_at: new Date().toISOString() }).eq("id", enrollmentId);
  revalidatePath(`/courses/${slug}`);
  return { ok: true };
}

/** Record a "Pause & Notice" answer. Solved once — re-answering is ignored. */
export async function answerRevision(
  courseId: string,
  slug: string,
  questionId: string,
  optionId: string,
): Promise<ActionResult> {
  const { supabase, user, enrollmentId } = await getUserAndEnrollment(courseId);
  if (!user) return { ok: false, reason: "unauthenticated" };
  if (!enrollmentId) return { ok: false, reason: "forbidden", message: "Not enrolled" };

  const { error } = await supabase
    .from("course_revision_answers")
    .upsert(
      { enrollment_id: enrollmentId, question_id: questionId, chosen_option_id: optionId },
      { onConflict: "enrollment_id,question_id", ignoreDuplicates: true },
    );
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true };
}

/** Grade the Integration Moment server-side (issues cert + awards skills on pass). */
export async function submitQuiz(courseId: string, slug: string, answers: Record<string, string>): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  const { data, error } = await supabase.rpc("submit_course_quiz", {
    target_course: courseId,
    answers,
  });
  if (error) return { ok: false, reason: "error", message: error.message };
  revalidatePath(`/courses/${slug}`);
  return { ok: true, data };
}
