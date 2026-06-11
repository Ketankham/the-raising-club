"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { emitNotification } from "@/lib/notifications/emit";
import {
  FLOW_VERSION,
  getNextStep,
  getSteps,
  isFinalStep,
  resolveResumeStep,
} from "./flow";
import {
  type OnboardingAnswers,
  type OnboardingRole,
  type OnboardingState,
  toFlowContext,
} from "./state";

/**
 * Server actions implementing the onboarding state-machine on top of Supabase.
 *
 * Anonymous-first: entering the wizard creates an anonymous auth user + a
 * matching `onboarding_progress` row. At the profile step the anon user is
 * upgraded in place to a permanent account (same auth.uid), so all progress is
 * preserved. Every step persists, so resume works on any device after login.
 */

type ActionResult<T = void> =
  | ({ ok: true } & (T extends void ? object : { data: T }))
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------
export async function getOnboardingState(): Promise<OnboardingState | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: progress }, { data: profile }] = await Promise.all([
    supabase.from("onboarding_progress").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("role, onboarding_completed_at").eq("id", user.id).maybeSingle(),
  ]);

  if (!progress) return null;

  return {
    userId: user.id,
    isAnonymous: user.is_anonymous ?? false,
    role: (profile?.role as OnboardingRole | null) ?? (progress.role as OnboardingRole | null) ?? null,
    flowVersion: progress.flow_version,
    currentStep: progress.current_step,
    completedSteps: progress.completed_steps ?? [],
    status: progress.status,
    answers: (progress.answers as OnboardingAnswers) ?? {},
    onboardingCompletedAt: profile?.onboarding_completed_at ?? null,
  };
}

// ---------------------------------------------------------------------------
// Start (anonymous) — idempotent
// ---------------------------------------------------------------------------
export async function startOnboarding(): Promise<ActionResult<{ currentStep: string }>> {
  const supabase = await createClient();

  let {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.user) return { ok: false, error: error?.message ?? "Could not start session" };
    user = data.user;
  }

  // Create the progress row if missing (idempotent on the PK).
  const { data: existing } = await supabase
    .from("onboarding_progress")
    .select("current_step")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from("onboarding_progress").insert({
      user_id: user.id,
      flow_version: FLOW_VERSION,
      current_step: "role-select",
      status: "in_progress",
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: { currentStep: "role-select" } };
  }

  return { ok: true, data: { currentStep: existing.current_step ?? "role-select" } };
}

// ---------------------------------------------------------------------------
// Select / change role
// ---------------------------------------------------------------------------
export async function selectRole(role: OnboardingRole): Promise<ActionResult<{ nextStep: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No session" };

  const { data: current } = await supabase
    .from("onboarding_progress")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const roleChanged = current?.role && current.role !== role;

  // Update role on both tables. A role change resets role-specific progress.
  await supabase.from("profiles").update({ role }).eq("id", user.id);

  const update: Record<string, unknown> = {
    role,
    current_step: "ways-to-use",
  };
  if (roleChanged) {
    // Discard role-specific staging + completed steps; keep the account.
    update.answers = {};
    update.completed_steps = ["role-select"];
    // NOTE: typed role tables (parent_*/caregiver_*/organizations) should also
    // be cleared on a confirmed role change — handled by a dedicated
    // `changeRole` action with a confirmation UI; logged to audit_log.
  } else {
    update.completed_steps = ["role-select"];
  }

  const { error } = await supabase.from("onboarding_progress").update(update).eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/onboarding", "layout");
  return { ok: true, data: { nextStep: "ways-to-use" } };
}

// ---------------------------------------------------------------------------
// Merge staged answers (e.g. caregiver branch intents, multi-selects)
// ---------------------------------------------------------------------------
export async function saveAnswers(partial: OnboardingAnswers): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No session" };

  const { data: row } = await supabase
    .from("onboarding_progress")
    .select("answers")
    .eq("user_id", user.id)
    .maybeSingle();

  const merged = { ...(row?.answers ?? {}), ...partial };
  const { error } = await supabase
    .from("onboarding_progress")
    .update({ answers: merged })
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Convert anonymous -> permanent account (the profile step)
// ---------------------------------------------------------------------------
export async function createAccount(input: {
  email: string;
  password: string;
  profile: {
    first_name?: string;
    last_name?: string;
    preferred_name?: string;
    phone?: string;
    zip_code?: string;
    lat?: number;
    lng?: number;
  };
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No session" };

  // Upgrade the anonymous user in place. `registered_at` + email_confirmed_at
  // are set by DB triggers (on_auth_user_updated).
  const { error: authError } = await supabase.auth.updateUser({
    email: input.email,
    password: input.password,
  });
  if (authError) {
    // Most common: email already in use -> caller should route to sign-in + merge.
    return { ok: false, error: authError.message };
  }

  // Capture the registration moment now (distinct from email confirmation).
  // With email confirmation ON, the anon user stays is_anonymous until they
  // confirm, and the email-change trigger won't fire yet — so we set
  // registered_at + email here explicitly. email_confirmed_at is set later by
  // the on_auth_user_updated trigger when the user confirms via /auth/confirm.
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ ...input.profile, email: input.email, registered_at: new Date().toISOString() })
    .eq("id", user.id);
  if (profileError) return { ok: false, error: profileError.message };

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Complete a step and advance (the workhorse)
// ---------------------------------------------------------------------------
export async function completeStep(
  currentSlug: string,
  answers?: OnboardingAnswers,
): Promise<ActionResult<{ nextStep: string | null; completed: boolean }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No session" };

  const state = await getOnboardingState();
  if (!state) return { ok: false, error: "No onboarding in progress" };

  // Merge any answers passed with this step.
  const mergedAnswers = { ...state.answers, ...(answers ?? {}) };
  const ctx = toFlowContext({ role: state.role, answers: mergedAnswers });
  if (!ctx) return { ok: false, error: "Role not set" };

  const completedSteps = Array.from(new Set([...state.completedSteps, currentSlug]));

  if (isFinalStep(ctx, currentSlug)) {
    // Promote everything collected in `answers` into the typed role tables.
    const promote = await promoteOnboardingData(supabase, user.id, state.role!, mergedAnswers);
    if (!promote.ok) return promote;

    const now = new Date().toISOString();
    await supabase
      .from("onboarding_progress")
      .update({
        answers: mergedAnswers,
        completed_steps: completedSteps,
        current_step: currentSlug,
        status: "completed",
        completed_at: now,
      })
      .eq("user_id", user.id);
    await supabase.from("profiles").update({ onboarding_completed_at: now }).eq("id", user.id);
    // Nudge paid-work caregivers to get verified (fail-soft — never blocks completion)
    if (state.role === "caregiver" && mergedAnswers.caregiverIntents?.includes("paid_work")) {
      emitNotification({ typeKey: "caregiver.verify_prompt", userId: user.id, link: "/profile#verify" }).catch(() => {});
    }

    revalidatePath("/onboarding", "layout");
    return { ok: true, data: { nextStep: null, completed: true } };
  }

  const next = getNextStep(ctx, currentSlug);
  const nextSlug = next?.slug ?? getSteps(ctx)[0].slug;

  const { error } = await supabase
    .from("onboarding_progress")
    .update({
      answers: mergedAnswers,
      completed_steps: completedSteps,
      current_step: nextSlug,
    })
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/onboarding", "layout");
  return { ok: true, data: { nextStep: nextSlug, completed: false } };
}

// ---------------------------------------------------------------------------
// Resume — returns the slug a returning user should land on (or null if done)
// ---------------------------------------------------------------------------
export async function resolveResume(): Promise<{ slug: string | null; status: OnboardingState["status"] | "none" }> {
  const state = await getOnboardingState();
  if (!state) return { slug: null, status: "none" };

  const ctx = toFlowContext(state);
  if (!ctx) return { slug: "role-select", status: state.status };

  const slug = resolveResumeStep(ctx, {
    currentStep: state.currentStep,
    completedSteps: state.completedSteps,
    status: state.status,
  });
  return { slug, status: state.status };
}

// ---------------------------------------------------------------------------
// Sign in (used by /sign-in)
// ---------------------------------------------------------------------------
export async function signInWithPassword(input: {
  email: string;
  password: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(input);
  if (error) return { ok: false, error: error.message };

  // Block deactivated accounts: sign them straight back out.
  const { data: profile } = await supabase
    .from("profiles")
    .select("deactivated_at")
    .eq("id", data.user.id)
    .maybeSingle();
  if (profile?.deactivated_at) {
    await supabase.auth.signOut();
    return { ok: false, error: "This account has been deactivated. Please contact support." };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Promotion: write the JSONB `answers` into typed role tables on completion.
// Idempotent (upsert / delete-then-insert) so re-running completion is safe.
// Not exported -> stays a plain helper, not a server action.
// ---------------------------------------------------------------------------
type Supa = Awaited<ReturnType<typeof createClient>>;

async function promoteOnboardingData(
  supabase: Supa,
  userId: string,
  role: OnboardingRole,
  a: OnboardingAnswers,
): Promise<ActionResult> {
  const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  const str = (v: unknown): string | null => (typeof v === "string" && v ? v : null);

  try {
    if (role === "parent") {
      await supabase.from("parent_profiles").upsert(
        { user_id: userId, child_term: str(a.child_term), intents: arr<string>(a.parentIntents) },
        { onConflict: "user_id" },
      );
      await supabase.from("children").delete().eq("parent_user_id", userId);
      const kids = arr<{ pet_name?: string; birth_month?: number; birth_year?: number }>(a.children);
      if (kids.length) {
        await supabase.from("children").insert(
          kids.map((k, i) => ({
            parent_user_id: userId,
            pet_name: k.pet_name ?? null,
            birth_month: k.birth_month ?? null,
            birth_year: k.birth_year ?? null,
            position: i,
          })),
        );
      }
    }

    if (role === "caregiver") {
      // Hub row first (arrays FK to it). Trigger derives looking_for_paid_work.
      await supabase.from("caregiver_profiles").upsert(
        {
          user_id: userId,
          intents: arr<string>(a.caregiverIntents),
          headline: str(a.headline),
          about: str(a.about),
          experience_level: str(a.experienceLevel),
        },
        { onConflict: "user_id" },
      );

      const replace = async (
        table: string,
        col: string,
        values: string[],
        extra: (v: string) => Record<string, unknown> = () => ({}),
      ) => {
        await supabase.from(table).delete().eq("user_id", userId);
        if (values.length) {
          await supabase
            .from(table)
            .insert(values.map((v) => ({ user_id: userId, [col]: v, ...extra(v) })));
        }
      };

      await replace("caregiver_age_groups", "age", arr<string>(a.ageGroups));
      await replace("caregiver_care_settings", "setting", arr<string>(a.careSettings));
      await replace("caregiver_experience_types", "exp_type", arr<string>(a.experienceTypes));
      const langs = arr<string>(a.languages);
      await replace("caregiver_languages", "language", langs, (v) => ({
        is_primary: v === langs[0],
      }));

      if (a.educationLevel) {
        await supabase
          .from("caregiver_education")
          .upsert({ user_id: userId, level: str(a.educationLevel) }, { onConflict: "user_id" });
      }
      const certs = arr<string>(a.certifications);
      await supabase.from("caregiver_certifications").delete().eq("user_id", userId);
      if (certs.length) {
        await supabase
          .from("caregiver_certifications")
          .insert(certs.map((name) => ({ user_id: userId, name })));
      }

      await supabase.from("caregiver_availability").upsert(
        {
          user_id: userId,
          types: arr<string>(a.availabilityTypes),
          windows: arr<string>(a.availabilityWindows),
          openness: arr<string>(a.availabilityOpenness),
        },
        { onConflict: "user_id" },
      );

      // Light track community context (only present when not job-seeking).
      if (a.currentlyWorking !== undefined) {
        await supabase.from("caregiver_community_context").upsert(
          {
            user_id: userId,
            currently_working: Boolean(a.currentlyWorking),
            pattern: str(a.pattern),
            setting: str(a.setting),
            size: str(a.size),
            ages: arr<string>(a.contextAges),
            context_note: str(a.contextNote),
          },
          { onConflict: "user_id" },
        );
        await supabase.from("caregiver_context_children").delete().eq("user_id", userId);
        const cc = arr<{ pet_name?: string; birth_month?: number; birth_year?: number }>(a.contextChildren);
        if (cc.length) {
          await supabase.from("caregiver_context_children").insert(
            cc.map((k, i) => ({
              user_id: userId,
              pet_name: k.pet_name ?? null,
              birth_month: k.birth_month ?? null,
              birth_year: k.birth_year ?? null,
              position: i,
            })),
          );
        }
      }
    }

    if (role === "organization") {
      // One org per owner (idempotent on re-run).
      const { data: existing } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_user_id", userId)
        .maybeSingle();

      const orgFields = {
        name: str(a.org_name) ?? "My Program",
        owner_user_id: userId,
        program_types: arr<string>(a.programTypes),
        ages_served: arr<string>(a.agesServed),
        size: str(a.programSize),
        multi_location: Boolean(a.multiLocation),
      };

      let orgId = existing?.id as string | undefined;
      if (orgId) {
        await supabase.from("organizations").update(orgFields).eq("id", orgId);
      } else {
        const { data: inserted, error } = await supabase
          .from("organizations")
          .insert(orgFields)
          .select("id")
          .single();
        if (error) return { ok: false, error: error.message };
        orgId = inserted.id as string;
      }

      await supabase
        .from("organization_members")
        .upsert(
          { org_id: orgId, user_id: userId, member_role: "owner", status: "active" },
          { onConflict: "org_id,user_id" },
        );
      await supabase.from("organization_profiles").upsert(
        {
          org_id: orgId,
          contact_role_title: str(a.contactRoleTitle),
          contact_role_other: str(a.contactRoleOther),
          intents: arr<string>(a.orgIntents),
        },
        { onConflict: "org_id" },
      );
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to save profile" };
  }
}
