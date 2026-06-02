"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export type ActionResult =
  | { ok: true; data?: any }
  | { ok: false; reason: "unauthenticated" | "forbidden" | "error"; message?: string };

export type CourseCheckoutResult =
  | { ok: true; url: string }
  | { ok: false; reason: "unauthenticated" | "already_enrolled" | "free" | "error"; message?: string };

/**
 * Paid-course checkout. Re-reads price/is_free server-side; creates a Stripe
 * Checkout (mode payment). Enrollment is granted by the webhook on success.
 */
export async function startCourseCheckout(courseId: string, slug: string): Promise<CourseCheckoutResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, price_cents, currency, is_free")
    .eq("id", courseId)
    .maybeSingle();
  if (!course) return { ok: false, reason: "error", message: "Course not found" };
  if (course.is_free || !course.price_cents) return { ok: false, reason: "free" };

  const { data: existing } = await supabase
    .from("course_enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();
  if (existing) return { ok: false, reason: "already_enrolled" };

  const resolved = await getStripe();
  if (!resolved) return { ok: false, reason: "error", message: "Payments are not configured yet." };

  const currency = (course.currency as string) || "usd";
  const base = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  try {
    const session = await resolved.stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: course.price_cents as number,
            product_data: { name: course.title as string },
          },
        },
      ],
      metadata: { kind: "course", courseId: course.id as string, userId: user.id, slug, courseName: course.title as string },
      customer_email: user.email || undefined,
      success_url: `${base}/courses/${slug}?payment=success`,
      cancel_url: `${base}/courses/${slug}?payment=cancelled`,
    });
    if (!session.url) return { ok: false, reason: "error", message: "Stripe did not return a URL." };
    return { ok: true, url: session.url };
  } catch (e) {
    return { ok: false, reason: "error", message: e instanceof Error ? e.message : "Checkout failed" };
  }
}

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
