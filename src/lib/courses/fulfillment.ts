import "server-only";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Grant course access after a successful one-time payment. Enrollment IS the
 * entitlement (course_enrollments row). Idempotent; runs under service-role.
 */
export async function fulfillCoursePurchase(admin: SupabaseClient, session: Stripe.Checkout.Session): Promise<void> {
  const md = session.metadata ?? {};
  const courseId = md.courseId as string | undefined;
  const userId = md.userId as string | undefined;
  if (!courseId || !userId) {
    console.error("[course fulfilment] missing metadata", session.id);
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  // Persist the purchase so it can be refunded within the 48h window. status
  // 'active' re-activates a previously-cancelled enrollment on re-purchase.
  await admin.from("course_enrollments").upsert(
    {
      user_id: userId,
      course_id: courseId,
      status: "active",
      amount_cents: session.amount_total ?? null,
      currency: session.currency ?? null,
      stripe_payment_intent_id: paymentIntentId,
      paid_at: new Date().toISOString(),
      cancelled_at: null,
      refunded_amount_cents: 0,
    },
    { onConflict: "user_id,course_id" },
  );

  try {
    await admin.rpc("create_notification", {
      p_user_id: userId,
      p_type_key: "course.purchased",
      p_vars: { courseName: (md.courseName as string) ?? "your course" },
      p_link: md.slug ? `/courses/${md.slug}` : null,
    });
  } catch (e) {
    console.error("[course fulfilment] notification failed", e);
  }
}
