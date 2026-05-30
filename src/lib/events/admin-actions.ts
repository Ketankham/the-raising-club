"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { EventFormInput } from "./types";

export type SaveEventResult =
  | { ok: true; id: string; slug: string }
  | { ok: false; reason: "unauthenticated" | "forbidden" | "error"; message?: string };

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || "event"}-${suffix}`;
}

function eventColumns(form: EventFormInput) {
  return {
    title: form.title,
    summary: form.summary ?? null,
    what_to_expect: form.whatToExpect ?? null,
    hero_image_url: form.heroImageUrl ?? null,
    join_mode: form.joinMode,
    style: form.style ?? null,
    participation_type: form.participationType,
    age_min_months: form.ageMinMonths ?? null,
    age_max_months: form.ageMaxMonths ?? null,
    price_model: form.priceModel,
    price_cents: form.priceModel === "paid" ? form.priceCents : 0,
    child_capacity: form.childCapacity ?? null,
    adult_capacity: form.adultCapacity ?? null,
    visibility: form.visibility,
    status: form.status,
    requires_approval: form.requiresApproval,
    waitlist_enabled: form.waitlistEnabled,
    is_featured: form.isFeatured,
    timezone: form.timezone,
    published_at: form.status === "published" ? new Date().toISOString() : null,
  };
}

async function writeSessionAndLocation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string,
  form: EventFormInput,
) {
  // Replace the single session + location (this admin form models one of each).
  await supabase.from("event_sessions").delete().eq("event_id", eventId);
  if (form.startsAt && form.endsAt) {
    await supabase
      .from("event_sessions")
      .insert({ event_id: eventId, starts_at: form.startsAt, ends_at: form.endsAt });
  }

  await supabase.from("event_locations").delete().eq("event_id", eventId);
  const loc = form.location;
  if (loc.kind === "digital") {
    await supabase.from("event_locations").insert({
      event_id: eventId,
      kind: "digital",
      platform: loc.platform || null,
      join_url: loc.joinUrl || null,
    });
  } else if (loc.neighborhood || loc.address) {
    await supabase.from("event_locations").insert({
      event_id: eventId,
      kind: "physical",
      neighborhood: loc.neighborhood || null,
      address: loc.address || null,
      arrival_notes: loc.arrivalNotes || null,
    });
  }
}

export async function createEvent(form: EventFormInput): Promise<SaveEventResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  const slug = slugify(form.title);
  const { data, error } = await supabase
    .from("events")
    .insert({
      ...eventColumns(form),
      slug,
      created_by: user.id,
      org_id: form.orgId ?? null,
      host_type: form.orgId ? "organization" : "trc",
    })
    .select("id, slug")
    .single();

  // RLS rejects an insert the user isn't allowed to make.
  if (error) {
    const forbidden = /row-level security|policy/i.test(error.message);
    return { ok: false, reason: forbidden ? "forbidden" : "error", message: error.message };
  }

  await writeSessionAndLocation(supabase, data.id, form);
  revalidatePath("/admin/events");
  revalidatePath("/events");
  return { ok: true, id: data.id, slug: data.slug };
}

export async function updateEvent(form: EventFormInput): Promise<SaveEventResult> {
  if (!form.id) return { ok: false, reason: "error", message: "Missing id" };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  const { data, error } = await supabase
    .from("events")
    .update(eventColumns(form))
    .eq("id", form.id)
    .select("id, slug")
    .maybeSingle();

  if (error) return { ok: false, reason: "error", message: error.message };
  if (!data) return { ok: false, reason: "forbidden" }; // RLS filtered the row out

  await writeSessionAndLocation(supabase, form.id, form);
  revalidatePath("/admin/events");
  revalidatePath(`/events/${data.slug}`);
  return { ok: true, id: data.id, slug: data.slug };
}

export type AttendanceResult = { ok: boolean; message?: string };

export async function setAttendanceStatus(
  regChildId: string,
  status: "registered" | "attended" | "no_show" | "cancelled",
): Promise<AttendanceResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("event_registration_children")
    .update({ attendance_status: status })
    .eq("id", regChildId);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
