"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true } | { ok: false; error: string };

async function myOrg() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, orgId: null as string | null };
  const { data: org } = await supabase.from("organizations").select("id").eq("owner_user_id", user.id).maybeSingle();
  return { supabase, orgId: org?.id ?? null };
}

const done = (): Result => {
  revalidatePath("/organization");
  return { ok: true };
};

export async function updateOrgAbout(about: string): Promise<Result> {
  const { supabase, orgId } = await myOrg();
  if (!orgId) return { ok: false, error: "No organization" };
  const { error } = await supabase.from("organizations").update({ about: about || null }).eq("id", orgId);
  return error ? { ok: false, error: error.message } : done();
}

export async function updateOrgProgram(input: {
  programTypes: string[];
  agesServed: string[];
  size: string | null;
  multiLocation: boolean;
}): Promise<Result> {
  const { supabase, orgId } = await myOrg();
  if (!orgId) return { ok: false, error: "No organization" };
  const { error } = await supabase
    .from("organizations")
    .update({
      program_types: input.programTypes,
      ages_served: input.agesServed,
      size: input.size,
      multi_location: input.multiLocation,
    })
    .eq("id", orgId);
  return error ? { ok: false, error: error.message } : done();
}

export async function toggleOrgPublish(isPublished: boolean): Promise<Result> {
  const { supabase, orgId } = await myOrg();
  if (!orgId) return { ok: false, error: "No organization" };
  const { error } = await supabase.from("organizations").update({ is_published: isPublished }).eq("id", orgId);
  return error ? { ok: false, error: error.message } : done();
}
