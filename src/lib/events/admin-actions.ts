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

  // Resources (external links, max 5) — replace the set.
  await supabase.from("event_resources").delete().eq("event_id", eventId);
  const resources = (form.resources ?? [])
    .filter((r) => r.label.trim() && r.url.trim())
    .slice(0, 5)
    .map((r, i) => ({
      event_id: eventId,
      label: r.label.trim(),
      url: r.url.trim(),
      kind: r.kind || "link",
      position: i,
      registrants_only: true,
    }));
  if (resources.length) await supabase.from("event_resources").insert(resources);

  // Instructors — replace the set.
  await supabase.from("event_instructors").delete().eq("event_id", eventId);
  const instructors = (form.instructors ?? [])
    .filter((i) => i.name.trim())
    .map((i, idx) => ({
      event_id: eventId,
      name: i.name.trim(),
      role_label: i.roleLabel?.trim() || null,
      bio: i.bio?.trim() || null,
      avatar_url: i.avatarUrl?.trim() || null,
      position: idx,
    }));
  if (instructors.length) await supabase.from("event_instructors").insert(instructors);
}

/**
 * Organizer display name shown on the list + detail screens: the organization's
 * name when the host belongs to a company, otherwise the creator's own name
 * (falling back to "The Raising Club" for platform events).
 */
async function resolveHostName(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string | null,
  creatorUserId: string,
): Promise<string> {
  if (orgId) {
    const { data } = await supabase.from("organizations").select("name").eq("id", orgId).maybeSingle();
    if (data?.name) return data.name;
  }
  const { data: p } = await supabase
    .from("profiles")
    .select("preferred_name, first_name, last_name, role")
    .eq("id", creatorUserId)
    .maybeSingle();
  const name =
    p?.preferred_name || [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim();
  if (name) return name;
  return "The Raising Club";
}

export async function createEvent(form: EventFormInput): Promise<SaveEventResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  const slug = slugify(form.title);
  const orgId = form.orgId ?? null;
  const hostName = await resolveHostName(supabase, orgId, user.id);
  const { data, error } = await supabase
    .from("events")
    .insert({
      ...eventColumns(form),
      slug,
      created_by: user.id,
      org_id: orgId,
      host_type: orgId ? "organization" : "trc",
      host_name: hostName,
    })
    .select("id, slug")
    .single();

  // RLS rejects an insert the user isn't allowed to make.
  if (error) {
    const forbidden = /row-level security|policy/i.test(error.message);
    return { ok: false, reason: forbidden ? "forbidden" : "error", message: error.message };
  }

  await writeSessionAndLocation(supabase, data.id, form);
  revalidatePath("/manage/events");
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

  // Recompute the host name from the event's own org/creator (not the editor).
  const { data: existing } = await supabase
    .from("events")
    .select("org_id, created_by")
    .eq("id", form.id)
    .maybeSingle();
  const hostName = await resolveHostName(
    supabase,
    existing?.org_id ?? null,
    existing?.created_by ?? user.id,
  );

  const { data, error } = await supabase
    .from("events")
    .update({ ...eventColumns(form), host_name: hostName })
    .eq("id", form.id)
    .select("id, slug")
    .maybeSingle();

  if (error) return { ok: false, reason: "error", message: error.message };
  if (!data) return { ok: false, reason: "forbidden" }; // RLS filtered the row out

  await writeSessionAndLocation(supabase, form.id, form);
  revalidatePath("/manage/events");
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
