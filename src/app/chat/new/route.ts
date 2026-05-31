import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Entry point for the marketplace "Message" buttons: /chat/new?to=<userId>.
 *  Finds-or-creates the 1:1 thread with that user and redirects into Chat. */
export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get("to");
  const ctxType = req.nextUrl.searchParams.get("ctxType");
  const ctxId = req.nextUrl.searchParams.get("ctxId");
  const origin = req.nextUrl.origin;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL(`/sign-in?next=/chat/new?to=${to ?? ""}`, origin));
  if (!to || to === user.id) return NextResponse.redirect(new URL("/chat", origin));

  const { data, error } = await supabase.rpc("get_or_create_direct_conversation", {
    other_user: to,
    ctx_type: ctxType,
    ctx_id: ctxId,
  });
  if (error || !data) return NextResponse.redirect(new URL("/chat", origin));

  return NextResponse.redirect(new URL(`/chat?c=${data}`, origin));
}
