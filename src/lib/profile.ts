import { createClient } from "@/lib/supabase/server";

export interface CaregiverProfileData {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  preferredName: string | null;
  email: string | null;
  phone: string | null;
  zip: string | null;
  avatarUrl: string | null;
  registeredAt: string | null;
  headline: string | null;
  about: string | null;
  experienceLevel: string | null;
  isPublished: boolean;
  lookingForPaidWork: boolean;
  ages: string[];
  settings: string[];
  experienceTypes: string[];
  languages: { language: string; is_primary: boolean }[];
  availability: { types: string[]; windows: string[]; openness: string[] } | null;
  education: { level: string | null; program: string | null; institution: string | null } | null;
  certifications: { id: string; name: string }[];
  reviews: { id: string; reviewer_name: string | null; relationship: string | null; rating: number | null; body: string | null }[];
  verifications: { type: string; status: string }[];
}

/** Public/visitor view — reads only published, non-sensitive fields (no email/phone). */
export async function getPublicCaregiverProfile(userId: string): Promise<CaregiverProfileData | null> {
  const supabase = await createClient();

  const { data: pub } = await supabase.rpc("public_caregiver", { uid: userId });
  if (!pub) return null; // not found or not published

  const [ages, settings, langs, exp, avail, edu, certs, reviews] = await Promise.all([
    supabase.from("caregiver_age_groups").select("age").eq("user_id", userId),
    supabase.from("caregiver_care_settings").select("setting").eq("user_id", userId),
    supabase.from("caregiver_languages").select("language, is_primary").eq("user_id", userId),
    supabase.from("caregiver_experience_types").select("exp_type").eq("user_id", userId),
    supabase.from("caregiver_availability").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("caregiver_education").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("caregiver_certifications").select("id, name").eq("user_id", userId),
    supabase.from("caregiver_reviews").select("id, reviewer_name, relationship, rating, body").eq("caregiver_user_id", userId).eq("is_published", true),
  ]);

  return {
    userId,
    firstName: pub.firstName,
    lastName: pub.lastInitial || null,
    preferredName: pub.preferredName,
    email: null,
    phone: null,
    zip: pub.zip,
    avatarUrl: pub.avatarUrl,
    registeredAt: pub.registeredAt,
    headline: pub.headline,
    about: pub.about,
    experienceLevel: pub.experienceLevel,
    isPublished: true,
    lookingForPaidWork: pub.lookingForPaidWork,
    ages: (ages.data ?? []).map((r) => r.age),
    settings: (settings.data ?? []).map((r) => r.setting),
    experienceTypes: (exp.data ?? []).map((r) => r.exp_type),
    languages: langs.data ?? [],
    availability: avail.data ? { types: avail.data.types ?? [], windows: avail.data.windows ?? [], openness: avail.data.openness ?? [] } : null,
    education: edu.data ? { level: edu.data.level, program: edu.data.program, institution: edu.data.institution } : null,
    certifications: certs.data ?? [],
    reviews: reviews.data ?? [],
    verifications: pub.idVerified ? [{ type: "identity", status: "verified" }] : [],
  };
}

export async function getCaregiverProfile(userId: string): Promise<CaregiverProfileData | null> {
  const supabase = await createClient();

  const [profile, cg, ages, settings, langs, exp, avail, edu, certs, reviews, verifs] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("caregiver_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("caregiver_age_groups").select("age").eq("user_id", userId),
    supabase.from("caregiver_care_settings").select("setting").eq("user_id", userId),
    supabase.from("caregiver_languages").select("language, is_primary").eq("user_id", userId),
    supabase.from("caregiver_experience_types").select("exp_type").eq("user_id", userId),
    supabase.from("caregiver_availability").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("caregiver_education").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("caregiver_certifications").select("id, name").eq("user_id", userId),
    supabase.from("caregiver_reviews").select("id, reviewer_name, relationship, rating, body").eq("caregiver_user_id", userId).eq("is_published", true),
    supabase.from("verifications").select("type, status").eq("user_id", userId),
  ]);

  if (!profile.data) return null;
  const p = profile.data;
  const c = cg.data;

  return {
    userId,
    firstName: p.first_name,
    lastName: p.last_name,
    preferredName: p.preferred_name,
    email: p.email,
    phone: p.phone,
    zip: p.zip_code,
    avatarUrl: p.avatar_url,
    registeredAt: p.registered_at,
    headline: c?.headline ?? null,
    about: c?.about ?? null,
    experienceLevel: c?.experience_level ?? null,
    isPublished: c?.is_published ?? false,
    lookingForPaidWork: c?.looking_for_paid_work ?? false,
    ages: (ages.data ?? []).map((r) => r.age),
    settings: (settings.data ?? []).map((r) => r.setting),
    experienceTypes: (exp.data ?? []).map((r) => r.exp_type),
    languages: langs.data ?? [],
    availability: avail.data
      ? { types: avail.data.types ?? [], windows: avail.data.windows ?? [], openness: avail.data.openness ?? [] }
      : null,
    education: edu.data ? { level: edu.data.level, program: edu.data.program, institution: edu.data.institution } : null,
    certifications: certs.data ?? [],
    reviews: reviews.data ?? [],
    verifications: verifs.data ?? [],
  };
}
