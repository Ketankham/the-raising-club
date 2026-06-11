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
    // Reject anonymous (unauthenticated) callers to prevent log-flooding abuse.
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });

    // Sanitize metadata: cap size and flatten to prevent large JSONB writes.
    let safeMetadata: Record<string, unknown> = {};
    if (metadata && typeof metadata === "object") {
      const serialized = JSON.stringify(metadata).slice(0, 5000);
      try { safeMetadata = JSON.parse(serialized); } catch { safeMetadata = {}; }
    }

    await supabase.from("user_error_logs").insert({
      user_id: user.id,
      page_url: typeof pageUrl === "string" ? pageUrl.slice(0, 500) : null,
      component: typeof component === "string" ? component.slice(0, 200) : null,
      error_type: typeof errorType === "string" ? errorType.slice(0, 100) : "unknown",
      message: String(message).slice(0, 2000),
      stack: stack ? String(stack).slice(0, 5000) : null,
      metadata: safeMetadata,
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Never let the error logger itself crash the app
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
