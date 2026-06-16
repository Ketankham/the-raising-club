import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "No admin client — SUPABASE_SERVICE_ROLE_KEY missing" });

  const t1 = await supabase.from("verifications").select("id, type, status").limit(5);
  const t2 = await supabase.from("verifications").select("id, admin_review_required, metadata").limit(5);
  const t3 = await supabase.from("verifications").select("id, profiles!inner(email)").limit(5);
  const t4 = await supabase
    .from("verifications")
    .select("id, user_id, type, status, provider, admin_review_required, reviewed_at, metadata, updated_at, profiles!inner(first_name, email, caregiver_profiles(is_published))")
    .limit(5);

  return NextResponse.json({
    t1: { count: t1.data?.length, error: t1.error },
    t2: { count: t2.data?.length, error: t2.error },
    t3: { count: t3.data?.length, error: t3.error },
    t4: { count: t4.data?.length, error: t4.error, sample: t4.data?.[0] },
  });
}
