"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, UserX, UserCheck } from "lucide-react";
import type { AdminUserDetail } from "@/lib/admin";
import type { Plan } from "@/lib/plans/types";
import { adminUpdatePersonalDetails, adminUpdatePlan, deactivateUser, reactivateUser } from "@/lib/admin-actions";

type Result = { ok: true } | { ok: false; error: string };

const ROLE_LABEL: Record<string, string> = {
  parent: "Parent / Guardian",
  caregiver: "Caregiver / Educator",
  organization: "Center / Program",
  admin: "Admin",
};

const inputClass =
  "w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-ink outline-none transition placeholder:text-ink/40 focus:border-primary focus:ring-1 focus:ring-primary";

function fmtDate(s: string | null) {
  return s ? new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
}

function Card({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

function ReadOnly({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="mt-0.5 text-sm text-ink">{value}</p>
    </div>
  );
}

function Saved({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-olive">
      <Check className="h-4 w-4" strokeWidth={3} /> Saved
    </span>
  );
}

function useSave() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  function run(action: () => Promise<Result>) {
    setError(null);
    setSaved(false);
    start(async () => {
      const res = await action();
      if (!res.ok) return setError(res.error);
      setSaved(true);
      router.refresh();
    });
  }
  return { pending, error, saved, run };
}

function planPrice(plan: Plan, annual: boolean): string {
  if (plan.price === "free") return "Free";
  if (plan.price === "custom") return "Custom";
  const monthly = annual ? Math.round(plan.price * 0.85) : plan.price;
  return `$${monthly}/mo${plan.unit ? ` ${plan.unit}` : ""}`;
}

export function AdminUserDetailView({ user, plans }: { user: AdminUserDetail; plans: Plan[] }) {
  const name = user.preferredName || [user.firstName, user.lastName].filter(Boolean).join(" ") || "—";

  // Personal details
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [preferredName, setPreferredName] = useState(user.preferredName ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [zip, setZip] = useState(user.zip ?? "");
  const details = useSave();

  // Plan
  const [annual, setAnnual] = useState(user.planInterval === "annual");
  const plan = useSave();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const freeKey = plans.find((p) => p.price === "free")?.key ?? null;
  const currentKey = user.planKey ?? freeKey;

  // Activation
  const activation = useSave();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to users
      </Link>

      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">{name}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {ROLE_LABEL[user.role ?? ""] ?? user.role ?? "—"} · {user.email ?? "no email"}
            {user.deactivated && <span className="ml-2 font-medium text-red-600">Deactivated</span>}
          </p>
        </div>
        {user.role !== "admin" && (
          <button
            type="button"
            disabled={activation.pending}
            onClick={() =>
              activation.run(() => (user.deactivated ? reactivateUser(user.id) : deactivateUser(user.id)))
            }
            className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
              user.deactivated
                ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                : "border-red-200 text-red-600 hover:bg-red-50"
            }`}
          >
            {user.deactivated ? <><UserCheck className="h-4 w-4" /> Reactivate</> : <><UserX className="h-4 w-4" /> Deactivate</>}
          </button>
        )}
      </header>

      <div className="space-y-6">
        {/* Account facts (read-only) */}
        <Card title="Account" description="Read-only. Email, password, and account type aren't editable here.">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <ReadOnly label="Account type" value={ROLE_LABEL[user.role ?? ""] ?? user.role ?? "—"} />
            <ReadOnly label="Email" value={user.email ?? "—"} />
            <ReadOnly label="Email status" value={user.emailConfirmed ? "Confirmed" : "Unconfirmed"} />
            <ReadOnly label="Onboarding" value={user.onboardingCompleted ? "Complete" : "Incomplete"} />
            <ReadOnly label="Registered" value={fmtDate(user.registeredAt ?? user.createdAt)} />
            <ReadOnly label="Status" value={user.deactivated ? "Deactivated" : "Active"} />
          </div>
        </Card>

        {/* Personal details (editable) */}
        <Card title="Personal details" description="Name and contact information.">
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              details.run(() => adminUpdatePersonalDetails(user.id, { firstName, lastName, preferredName, phone, zip }));
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Labeled label="First name"><input className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} /></Labeled>
              <Labeled label="Last name"><input className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} /></Labeled>
            </div>
            <Labeled label="Preferred name"><input className={inputClass} value={preferredName} onChange={(e) => setPreferredName(e.target.value)} /></Labeled>
            <div className="grid gap-4 sm:grid-cols-2">
              <Labeled label="Phone"><input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} /></Labeled>
              <Labeled label="ZIP code"><input className={inputClass} value={zip} onChange={(e) => setZip(e.target.value)} /></Labeled>
            </div>
            {details.error && <p className="text-sm text-red-600">{details.error}</p>}
            <div className="flex items-center gap-4">
              <button type="submit" disabled={details.pending} className="rounded-full bg-primary px-7 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50">
                {details.pending ? "Saving…" : "Save changes"}
              </button>
              <Saved show={details.saved} />
            </div>
          </form>
        </Card>

        {/* Membership */}
        {plans.length > 0 && (
          <Card title="Membership" description="The plan recorded for this user (no payment is processed).">
            <div className="mb-5 inline-flex items-center rounded-full bg-lavender p-1 text-sm font-semibold">
              <button type="button" onClick={() => setAnnual(false)} className={`rounded-full px-4 py-1.5 transition ${!annual ? "bg-white text-ink shadow-sm" : "text-ink/60"}`}>Monthly</button>
              <button type="button" onClick={() => setAnnual(true)} className={`rounded-full px-4 py-1.5 transition ${annual ? "bg-white text-ink shadow-sm" : "text-ink/60"}`}>Annual <span className="text-xs font-bold text-olive">-15%</span></button>
            </div>
            <div className="grid gap-3">
              {plans.map((p) => {
                const isCurrent = p.key === currentKey;
                return (
                  <div key={p.key} className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 transition ${isCurrent ? "border-yellow bg-yellow/15" : "border-ink/12 bg-white"}`}>
                    <div className="min-w-0">
                      <p className="font-display font-bold text-ink">
                        {p.name}
                        {isCurrent && <span className="ml-2 rounded-full bg-yellow px-2 py-0.5 text-xs font-semibold text-ink">Current</span>}
                      </p>
                      <p className="mt-0.5 text-sm text-ink-soft">{planPrice(p, annual)}</p>
                    </div>
                    {p.price !== "custom" && (
                      <button
                        type="button"
                        disabled={plan.pending || isCurrent}
                        onClick={() => { setPendingKey(p.key); plan.run(() => adminUpdatePlan(user.id, p.key, annual ? "annual" : "monthly")); }}
                        className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {plan.pending && pendingKey === p.key ? "Saving…" : isCurrent ? "Selected" : "Set plan"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {plan.error && <p className="mt-3 text-sm text-red-600">{plan.error}</p>}
          </Card>
        )}
      </div>
    </div>
  );
}
