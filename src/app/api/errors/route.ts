import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, stack, component, errorType, pageUrl, metadata } = body as {
      message: string;
      stack?: string;
      component?: string;
      errorType?: string;
      pageUrl?: string;
      metadata?: Record<string, unknown>;
    };

    if (!message || typeof message !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("user_error_logs").insert({
      user_id: user?.id ?? null,
      page_url: pageUrl ?? null,
      component: component ?? null,
      error_type: errorType ?? "unknown",
      message: String(message).slice(0, 2000),
      stack: stack ? String(stack).slice(0, 5000) : null,
      metadata: metadata ?? {},
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Never let the error logger itself crash the app
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
