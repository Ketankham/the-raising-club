import { createClient } from "@/lib/supabase/server";

export interface ReviewItem {
  id: string;
  reviewerName: string | null;
  relationship: string | null;
  rating: number | null;
  body: string | null;
  isPublished: boolean;
  status: string;
  createdAt: string;
}

export interface ReviewInvite {
  id: string;
  inviteeName: string;
  relationship: string | null;
  status: string;
  token: string;
  createdAt: string;
}

export interface CaregiverReviewsData {
  published: ReviewItem[];
  pending: ReviewItem[];
  invites: ReviewInvite[];
}

/** Owner view: all of a caregiver's reviews (to moderate) + open invitations. */
export async function getCaregiverReviews(userId: string): Promise<CaregiverReviewsData> {
  const supabase = await createClient();
  const [{ data: reviews }, { data: invites }] = await Promise.all([
    supabase
      .from("caregiver_reviews")
      .select("id, reviewer_name, relationship, rating, body, is_published, status, created_at")
      .eq("caregiver_user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("review_invitations")
      .select("id, invitee_name, relationship, status, token, created_at")
      .eq("caregiver_user_id", userId)
      .eq("status", "invited")
      .order("created_at", { ascending: false }),
  ]);

  const map = (r: {
    id: string; reviewer_name: string | null; relationship: string | null;
    rating: number | null; body: string | null; is_published: boolean; status: string; created_at: string;
  }): ReviewItem => ({
    id: r.id, reviewerName: r.reviewer_name, relationship: r.relationship, rating: r.rating,
    body: r.body, isPublished: r.is_published, status: r.status, createdAt: r.created_at,
  });

  const all = (reviews ?? []).map(map);
  return {
    published: all.filter((r) => r.isPublished),
    pending: all.filter((r) => !r.isPublished && r.status !== "declined"),
    invites: (invites ?? []).map((i) => ({
      id: i.id, inviteeName: i.invitee_name, relationship: i.relationship,
      status: i.status, token: i.token, createdAt: i.created_at,
    })),
  };
}

/** Public: token info for the review form (caregiver name + validity). */
export async function getReviewInvitationInfo(token: string): Promise<{ valid: boolean; caregiverName?: string; inviteeName?: string; relationship?: string }> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("review_invitation_info", { invite_token: token });
  if (!data || !data.valid) return { valid: false };
  return { valid: true, caregiverName: data.caregiverName, inviteeName: data.inviteeName, relationship: data.relationship };
}
