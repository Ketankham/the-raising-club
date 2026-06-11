"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

/** Caregiver invites someone to leave a review. Returns a shareable link. */
export async function inviteReview(input: {
  name: string;
  relationship?: string;
  email?: string;
  phone?: string;
}): Promise<Result<{ link: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };
  if (!input.name.trim()) return { ok: false, error: "Enter who you're inviting." };

  const { data, error } = await supabase
    .from("review_invitations")
    .insert({
      caregiver_user_id: user.id,
      invitee_name: input.name.trim(),
      relationship: input.relationship?.trim() || null,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
    })
    .select("token")
    .single();
  if (error) return { ok: false, error: error.message };

  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://theraisingclub.com";
  revalidatePath("/profile/reviews");
  return { ok: true, data: { link: `${base}/review/${data.token}` } };
}

/** Caregiver publishes a submitted review (it then shows on the profile). */
export async function publishReview(id: string): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const { error } = await supabase
    .from("caregiver_reviews")
    .update({ is_published: true, status: "published" })
    .eq("id", id)
    .eq("caregiver_user_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/profile/reviews");
  revalidatePath(`/profile/${user.id}`);
  return { ok: true };
}

/** Caregiver declines (hides) a submitted review. */
export async function declineReview(id: string): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const { error } = await supabase
    .from("caregiver_reviews")
    .update({ is_published: false, status: "declined" })
    .eq("id", id)
    .eq("caregiver_user_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/profile/reviews");
  return { ok: true };
}

/** Public: a reviewer submits a review via their tokened link (no account). */
export async function submitReviewByToken(input: {
  token: string;
  reviewerName: string;
  relationship: string;
  rating: number;
  body: string;
}): Promise<Result> {
  const supabase = await createClient();
  if (input.rating < 1 || input.rating > 5) return { ok: false, error: "Please choose a rating." };
  if (!input.reviewerName.trim()) return { ok: false, error: "Please enter your name." };
  if (input.reviewerName.length > 200) return { ok: false, error: "Name is too long." };
  if (input.body.length > 2000) return { ok: false, error: "Review body must be under 2000 characters." };
  if (!input.relationship.trim()) return { ok: false, error: "Please enter your relationship." };
  if (input.relationship.length > 200) return { ok: false, error: "Relationship is too long." };
  const { data, error } = await supabase.rpc("submit_review", {
    invite_token: input.token,
    p_reviewer_name: input.reviewerName.trim().slice(0, 200),
    p_relationship: input.relationship.trim().slice(0, 200),
    p_rating: input.rating,
    p_body: input.body.trim().slice(0, 2000),
  });
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "This review link is invalid or has already been used." };
  return { ok: true };
}
