"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth";

export function SignOutButton() {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() => start(() => signOut())}
      disabled={pending}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition hover:text-ink disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" />
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
