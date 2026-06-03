"use client";

/**
 * Send an error to /api/errors so it appears in the admin error log.
 * Fire-and-forget — never throws, never blocks the UI.
 */
export function reportError(
  error: unknown,
  context?: {
    component?: string;
    errorType?: "react_boundary" | "unhandled_rejection" | "action_failure" | "network" | "unknown";
    metadata?: Record<string, unknown>;
  },
) {
  try {
    const err = error instanceof Error ? error : new Error(String(error));
    const pageUrl = typeof window !== "undefined" ? window.location.href : undefined;

    void fetch("/api/errors", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: err.message,
        stack: err.stack,
        component: context?.component,
        errorType: context?.errorType ?? "unknown",
        pageUrl,
        metadata: context?.metadata,
      }),
    }).catch(() => {
      // swallow network errors from the reporter itself
    });
  } catch {
    // never throw from the reporter
  }
}
