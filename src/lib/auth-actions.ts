"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export async function requestPasswordReset(email: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") ?? "https://theraisingclub.com";

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${origin}/auth/reset-password`,
  });

  if (error) return { ok: false, error: "If that email is registered, a reset link has been sent." };
  return { ok: true };
}

export async function updatePassword(password: string): Promise<{ ok: boolean; error?: string }> {
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
