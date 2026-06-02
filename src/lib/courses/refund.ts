import "server-only";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

/* eslint-disable @typescript-eslint/no-explicit-any */

export type CourseCancelOutcome = { ok: boolean; refunded: boolean; amountCents: number };

function money(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency || "usd").toUpperCase(),
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/**
 * Cancel a paid course purchase: refund the payment, mark the enrollment
 * cancelled (which revokes content access — cancelled enrollments are treated as
 * not-enrolled), and notify the learner (course.cancelled). Runs under the
 * SERVICE-ROLE client. No-op if already cancelled. If the Stripe refund call
 * fails we don't mark it cancelled, so it can be retried.
 */
export async function cancelCourseEnrollment(
  admin: SupabaseClient,
  stripe: Stripe | null,
  enrollmentId: string,
): Promise<CourseCancelOutcome> {
  const { data: enr } = await admin
    .from("course_enrollments")
    .select(
      "id, user_id, status, amount_cents, currency, stripe_payment_intent_id, courses ( title, slug )",
    )
    .eq("id", enrollmentId)
    .maybeSingle();
  if (!enr || (enr as any).status === "cancelled") return { ok: false, refunded: false, amountCents: 0 };

  const pi = (enr as any).stripe_payment_intent_id as string | null;
  let refunded = false;
  let refundedAmount = 0;
  if (pi) {
    if (stripe) {
      try {
        await stripe.refunds.create({ payment_intent: pi });
      } catch (e) {
        console.error("[course refund] stripe refund failed", e);
        return { ok: false, refunded: false, amountCents: 0 };
      }
    }
    refunded = true;
    refundedAmount = (enr as any).amount_cents ?? 0;
  }

  await admin
    .from("course_enrollments")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      refunded_amount_cents: refundedAmount,
    })
    .eq("id", enrollmentId);

  const course = Array.isArray((enr as any).courses) ? (enr as any).courses[0] : (enr as any).courses;
  try {
    await admin.rpc("create_notification", {
      p_user_id: (enr as any).user_id,
      p_type_key: "course.cancelled",
      p_vars: {
        course_name: course?.title ?? "your course",
        amount: money(refundedAmount, (enr as any).currency ?? "usd"),
      },
      p_link: course?.slug ? `/courses/${course.slug}` : null,
    });
  } catch (e) {
    console.error("[course refund] notification failed", e);
  }

  return { ok: true, refunded, amountCents: refundedAmount };
}
