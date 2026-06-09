import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Entry point for the marketplace "Message" buttons. Finds-or-creates the 1:1
 *  thread and redirects into Chat. Two forms:
 *    /chat/new?to=<userId>          — message a specific user (caregiver/family)
 *    /chat/new?job=<jobId>          — message the family who posted a job (the
 *                                     poster's identity is otherwise hidden; the
 *                                     job is RLS-readable by an applicant/invitee
 *                                     or while it's open). */
export async function GET(req: NextRequest) {
  let to = req.nextUrl.searchParams.get("to");
  const job = req.nextUrl.searchParams.get("job");
  let ctxType = req.nextUrl.searchParams.get("ctxType");
  let ctxId = req.nextUrl.searchParams.get("ctxId");
  const origin = req.nextUrl.origin;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const next = job ? `/chat/new?job=${job}` : `/chat/new?to=${to ?? ""}`;
    return NextResponse.redirect(new URL(`/sign-in?next=${next}`, origin));
  }

  // Resolve a job's poster when invoked with ?job=.
  if (!to && job) {
    const { data: jp } = await supabase.from("job_posts").select("owner_user_id").eq("id", job).maybeSingle();
    to = jp?.owner_user_id ?? null;
    ctxType = ctxType ?? "job";
    ctxId = ctxId ?? job;
  }

  if (!to || to === user.id) return NextResponse.redirect(new URL("/chat", origin));

  const { data, error } = await supabase.rpc("get_or_create_direct_conversation", {
    other_user: to,
    ctx_type: ctxType,
    ctx_id: ctxId,
  });
  if (error || !data) return NextResponse.redirect(new URL("/chat", origin));

  return NextResponse.redirect(new URL(`/chat?c=${data}`, origin));
}
