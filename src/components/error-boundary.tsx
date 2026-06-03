"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportError } from "@/lib/report-error";

interface Props {
  children: ReactNode;
  /** Optional fallback UI. Defaults to a simple "Something went wrong" message. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, {
      errorType: "react_boundary",
      component: info.componentStack?.split("\n")[1]?.trim() ?? undefined,
      metadata: { componentStack: info.componentStack ?? "" },
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="rounded-2xl bg-red-50 px-6 py-8 shadow-sm">
            <p className="text-2xl">⚠️</p>
            <h2 className="mt-3 font-display text-xl font-bold text-ink">Something went wrong</h2>
            <p className="mt-2 text-sm text-ink-soft">
              This part of the page ran into a problem. Our team has been notified.
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, message: "" })}
              className="mt-4 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
