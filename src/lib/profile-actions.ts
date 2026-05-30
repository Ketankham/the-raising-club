"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true } | { ok: false; error: string };

async function meAndClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

const done = (): Result => {
  revalidatePath("/profile");
  return { ok: true };
};

export async function updateAbout(input: { headline: string; about: string }): Promise<Result> {
  const { supabase, userId } = await meAndClient();
  if (!userId) return { ok: false, error: "Not signed in" };
  const { error } = await supabase
    .from("caregiver_profiles")
    .upsert({ user_id: userId, headline: input.headline || null, about: input.about || null }, { onConflict: "user_id" });
  return error ? { ok: false, error: error.message } : done();
}

export async function updateContact(input: { phone: string; zip: string }): Promise<Result> {
  const { supabase, userId } = await meAndClient();
  if (!userId) return { ok: false, error: "Not signed in" };
  const { error } = await supabase.from("profiles").update({ phone: input.phone || null, zip_code: input.zip || null }).eq("id", userId);
  return error ? { ok: false, error: error.message } : done();
}

export async function updateLanguages(languages: string[]): Promise<Result> {
  const { supabase, userId } = await meAndClient();
  if (!userId) return { ok: false, error: "Not signed in" };
  await supabase.from("caregiver_languages").delete().eq("user_id", userId);
  if (languages.length) {
    const { error } = await supabase
      .from("caregiver_languages")
      .insert(languages.map((language, i) => ({ user_id: userId, language, is_primary: i === 0 })));
    if (error) return { ok: false, error: error.message };
  }
  return done();
}

export async function updateEducationAndCerts(input: { level: string; certifications: string[] }): Promise<Result> {
  const { supabase, userId } = await meAndClient();
  if (!userId) return { ok: false, error: "Not signed in" };
  await supabase.from("caregiver_education").upsert({ user_id: userId, level: input.level || null }, { onConflict: "user_id" });
  await supabase.from("caregiver_certifications").delete().eq("user_id", userId);
  if (input.certifications.length) {
    await supabase.from("caregiver_certifications").insert(input.certifications.map((name) => ({ user_id: userId, name })));
  }
  return done();
}

async function replaceSet(table: string, col: string, userId: string, values: string[]) {
  const supabase = await createClient();
  await supabase.from(table).delete().eq("user_id", userId);
  if (values.length) await supabase.from(table).insert(values.map((v) => ({ user_id: userId, [col]: v })));
}

export async function updateAges(values: string[]): Promise<Result> {
  const { userId } = await meAndClient();
  if (!userId) return { ok: false, error: "Not signed in" };
  await replaceSet("caregiver_age_groups", "age", userId, values);
  return done();
}

export async function updateSettings(values: string[]): Promise<Result> {
  const { userId } = await meAndClient();
  if (!userId) return { ok: false, error: "Not signed in" };
  await replaceSet("caregiver_care_settings", "setting", userId, values);
  return done();
}

export async function updateExperience(values: string[]): Promise<Result> {
  const { userId } = await meAndClient();
  if (!userId) return { ok: false, error: "Not signed in" };
  await replaceSet("caregiver_experience_types", "exp_type", userId, values);
  return done();
}

export async function updateAvailability(input: { types: string[]; windows: string[]; openness: string[] }): Promise<Result> {
  const { supabase, userId } = await meAndClient();
  if (!userId) return { ok: false, error: "Not signed in" };
  const { error } = await supabase
    .from("caregiver_availability")
    .upsert({ user_id: userId, types: input.types, windows: input.windows, openness: input.openness }, { onConflict: "user_id" });
  return error ? { ok: false, error: error.message } : done();
}

export async function togglePublish(isPublished: boolean): Promise<Result> {
  const { supabase, userId } = await meAndClient();
  if (!userId) return { ok: false, error: "Not signed in" };
  const { error } = await supabase
    .from("caregiver_profiles")
    .upsert({ user_id: userId, is_published: isPublished }, { onConflict: "user_id" });
  return error ? { ok: false, error: error.message } : done();
}
