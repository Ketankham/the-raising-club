"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/report-error";

/**
 * Mounts once at the root to capture unhandled promise rejections and
 * uncaught JS errors that the React error boundary doesn't catch
 * (e.g. errors in event handlers, async callbacks, third-party scripts).
 */
export function GlobalErrorHandler() {
  useEffect(() => {
    function onUnhandledRejection(e: PromiseRejectionEvent) {
      reportError(e.reason ?? new Error("Unhandled promise rejection"), {
        errorType: "unhandled_rejection",
      });
    }

    function onError(e: ErrorEvent) {
      // Skip cross-origin script errors (no useful info) and ResizeObserver noise
      if (!e.message || e.message === "Script error." || e.message.includes("ResizeObserver")) return;
      reportError(new Error(e.message), {
        errorType: "unknown",
        metadata: { filename: e.filename, lineno: e.lineno, colno: e.colno },
      });
    }

    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("error", onError);
    };
  }, []);

  return null;
}
