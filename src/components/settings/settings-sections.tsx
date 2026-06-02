"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Field, inputClass, ErrorText, MultiSelect, type Option } from "@/components/onboarding/steps/ui";
import type { Plan } from "@/lib/plans/types";
import {
  updatePersonalDetails,
  updateEmail,
  updatePassword,
  sendPasswordReset,
  updatePlan,
  updateParentPreferences,
} from "@/lib/settings/actions";
import { startSubscriptionCheckout, openBillingPortal } from "@/lib/billing/actions";

type Result = { ok: true } | { ok: false; error: string };

const ROLE_LABEL: Record<string, string> = {
  parent: "Parent / Guardian",
  caregiver: "Caregiver / Educator",
  organization: "Center / Program",
};

const PARENT_INTENTS: Option[] = [
  { value: "find_care", label: "I'm looking for care for my child" },
  { value: "connect_families", label: "I want to connect with other families nearby" },
  { value: "events", label: "I want to join or host events and activities" },
  { value: "learn", label: "I want to learn more about child development and everyday routines" },
  { value: "guidance_team", label: "I already have childcare and want guidance for our family and care team" },
];

// ---------------------------------------------------------------------------
// Shared shells
// ---------------------------------------------------------------------------
function Card({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function SaveButton({ pending, label = "Save changes" }: { pending: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-primary px-7 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Saving…" : label}
    </button>
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

/** Wires a server action to pending/error/saved feedback for a form section. */
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

// ---------------------------------------------------------------------------
// Personal details
// ---------------------------------------------------------------------------
export function PersonalDetailsSection(props: {
  firstName: string;
  lastName: string;
  preferredName: string;
  phone: string;
  zip: string;
}) {
  const [firstName, setFirstName] = useState(props.firstName);
  const [lastName, setLastName] = useState(props.lastName);
  const [preferredName, setPreferredName] = useState(props.preferredName);
  const [phone, setPhone] = useState(props.phone);
  const [zip, setZip] = useState(props.zip);
  const { pending, error, saved, run } = useSave();

  return (
    <Card title="Personal details" description="Your name and contact information.">
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => updatePersonalDetails({ firstName, lastName, preferredName, phone, zip }));
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name">
            <input className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </Field>
          <Field label="Last name">
            <input className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </Field>
        </div>
        <Field label="Preferred name" hint="What children and families call you.">
          <input className={inputClass} value={preferredName} onChange={(e) => setPreferredName(e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone">
            <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Add a phone number" />
          </Field>
          <Field label="ZIP code" hint="Used to find nearby families and care.">
            <input className={inputClass} value={zip} onChange={(e) => setZip(e.target.value)} placeholder="Add your ZIP" />
          </Field>
        </div>
        <ErrorText>{error}</ErrorText>
        <div className="flex items-center gap-4">
          <SaveButton pending={pending} />
          <Saved show={saved} />
        </div>
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Parent preferences
// ---------------------------------------------------------------------------
export function ParentPreferencesSection(props: { childTerm: string; intents: string[] }) {
  const [childTerm, setChildTerm] = useState(props.childTerm);
  const [intents, setIntents] = useState<string[]>(props.intents);
  const { pending, error, saved, run } = useSave();

  return (
    <Card title="Family preferences" description="Personalize what you see on The Raising Club.">
      <form
        className="grid gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => updateParentPreferences({ childTerm, intents }));
        }}
      >
        <Field label="What does your child call you?" hint="Mom, Dad, Abuela, Tito, a nickname…">
          <input className={inputClass} value={childTerm} onChange={(e) => setChildTerm(e.target.value)} />
        </Field>
        <div>
          <span className="mb-2 block text-sm font-medium text-ink">What brings you here right now?</span>
          <MultiSelect options={PARENT_INTENTS} value={intents} onChange={setIntents} />
        </div>
        <ErrorText>{error}</ErrorText>
        <div className="flex items-center gap-4">
          <SaveButton pending={pending} />
          <Saved show={saved} />
        </div>
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Link out to a separate profile editor (caregiver / organization)
// ---------------------------------------------------------------------------
export function ProfileLinkSection(props: { title: string; body: string; href: string; cta: string }) {
  return (
    <Card title={props.title} description={props.body}>
      <Link
        href={props.href}
        className="inline-flex items-center rounded-full bg-ink/5 px-6 py-2.5 font-display text-sm font-semibold text-ink transition hover:bg-ink/10"
      >
        {props.cta}
      </Link>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Account — email (editable), role (read-only), member-since
// ---------------------------------------------------------------------------
export function AccountSection(props: { email: string; role: string; memberSince: string | null }) {
  const [email, setEmail] = useState(props.email);
  const { pending, error, saved, run } = useSave();
  const changed = email.trim() !== props.email;

  return (
    <Card title="Account" description="Your sign-in email and account type.">
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => updateEmail(email));
        }}
      >
        <Field label="Email">
          <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        {changed && (
          <p className="text-xs text-ink-soft">
            We&rsquo;ll send a confirmation link to the new address. (Email delivery is being set up — the link may
            not arrive yet.)
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Account type">
            <div className={`${inputClass} flex items-center bg-ink/[0.03] text-ink-soft`}>
              {ROLE_LABEL[props.role] ?? props.role}
            </div>
          </Field>
          {props.memberSince && (
            <Field label="Member since">
              <div className={`${inputClass} flex items-center bg-ink/[0.03] text-ink-soft`}>{props.memberSince}</div>
            </Field>
          )}
        </div>

        <ErrorText>{error}</ErrorText>
        <div className="flex items-center gap-4">
          <SaveButton pending={pending} label="Update email" />
          <Saved show={saved} />
        </div>
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Security — change password + send reset link
// ---------------------------------------------------------------------------
export function SecuritySection() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const { pending, error, saved, run } = useSave();
  const [localError, setLocalError] = useState<string | null>(null);

  const reset = useSave();
  const [resetSent, setResetSent] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (password.length < 8) return setLocalError("Password must be at least 8 characters");
    if (password !== confirm) return setLocalError("Passwords don't match");
    run(async () => {
      const res = await updatePassword(password);
      if (res.ok) {
        setPassword("");
        setConfirm("");
      }
      return res;
    });
  }

  return (
    <Card title="Security" description="Change your password.">
      <form className="grid gap-4" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="New password">
            <input type="password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </Field>
          <Field label="Confirm new password">
            <input type="password" className={inputClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </Field>
        </div>
        <ErrorText>{localError || error}</ErrorText>
        <div className="flex items-center gap-4">
          <SaveButton pending={pending} label="Update password" />
          <Saved show={saved} />
        </div>
      </form>

      <div className="mt-6 border-t border-ink/10 pt-5">
        <p className="text-sm text-ink-soft">
          Prefer a reset link by email?{" "}
          <button
            type="button"
            disabled={reset.pending}
            onClick={() =>
              reset.run(async () => {
                const res = await sendPasswordReset();
                if (res.ok) setResetSent(true);
                return res;
              })
            }
            className="font-medium text-primary hover:underline disabled:opacity-50"
          >
            Send a password reset link
          </button>
        </p>
        {resetSent && <p className="mt-1 text-xs text-olive">If email is configured, a reset link is on its way.</p>}
        <ErrorText>{reset.error}</ErrorText>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Membership — pick a plan for this role
// ---------------------------------------------------------------------------
function planPrice(plan: Plan, annual: boolean): string {
  if (plan.price === "free") return "Free";
  if (plan.price === "custom") return "Custom";
  const monthly = annual ? Math.round(plan.price * 0.85) : plan.price;
  return `$${monthly}/mo${plan.unit ? ` ${plan.unit}` : ""}`;
}

export function MembershipSection(props: {
  plans: Plan[];
  currentPlanKey: string | null;
  currentInterval: "monthly" | "annual";
  status?: string;
  entitlementUntil?: string | null;
}) {
  const [annual, setAnnual] = useState(props.currentInterval === "annual");
  const { pending, error, run } = useSave();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [billing, startBilling] = useTransition();
  const [billingError, setBillingError] = useState<string | null>(null);

  // The free starter plan is stored as plan_key = null.
  const freeKey = props.plans.find((p) => p.price === "free")?.key ?? null;
  const currentKey = props.currentPlanKey ?? freeKey;
  const hasPaidSub = props.status === "active" || props.status === "trialing" || props.status === "past_due";
  const showStatus = Boolean(props.status) && props.status !== "none";

  function choose(plan: Plan) {
    setPendingKey(plan.key);
    setBillingError(null);
    const priceId = annual ? plan.stripePriceAnnualId : plan.stripePriceMonthlyId;
    // Paid plan with a configured Stripe price → Checkout. Otherwise record-only.
    if (plan.price !== "free" && priceId) {
      startBilling(async () => {
        const res = await startSubscriptionCheckout(plan.key, annual ? "annual" : "monthly");
        if (res.ok) window.location.href = res.url;
        else setBillingError(res.error);
      });
      return;
    }
    run(() => updatePlan(plan.key, annual ? "annual" : "monthly"));
  }

  function manageBilling() {
    setBillingError(null);
    startBilling(async () => {
      const res = await openBillingPortal();
      if (res.ok) window.location.href = res.url;
      else setBillingError(res.error);
    });
  }

  return (
    <Card title="Membership" description="Choose the plan that fits where you are right now.">
      {showStatus && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-cream/70 px-4 py-3">
          <div>
            <p className="text-sm text-ink">
              {props.status === "comp" ? "Complimentary access" : "Billing status"}:{" "}
              <span className="font-semibold capitalize">{props.status}</span>
            </p>
            {props.entitlementUntil && (
              <p className="mt-0.5 text-xs text-ink-soft">
                {props.status === "canceled" ? "Access ends" : props.status === "past_due" ? "Was due" : "Renews"} on{" "}
                {new Date(props.entitlementUntil).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            )}
          </div>
          {hasPaidSub && (
            <button
              type="button"
              onClick={manageBilling}
              disabled={billing}
              className="rounded-full border border-ink/15 px-4 py-1.5 text-sm font-medium text-ink transition hover:bg-ink/5 disabled:opacity-50"
            >
              {billing ? "Opening…" : "Manage billing"}
            </button>
          )}
        </div>
      )}
      <div className="mb-5 inline-flex items-center rounded-full bg-lavender p-1 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setAnnual(false)}
          className={`rounded-full px-4 py-1.5 transition ${!annual ? "bg-white text-ink shadow-sm" : "text-ink/60"}`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setAnnual(true)}
          className={`rounded-full px-4 py-1.5 transition ${annual ? "bg-white text-ink shadow-sm" : "text-ink/60"}`}
        >
          Annual <span className="text-xs font-bold text-olive">-15%</span>
        </button>
      </div>

      <div className="grid gap-3">
        {props.plans.map((plan) => {
          const isCurrent = plan.key === currentKey;
          return (
            <div
              key={plan.key}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 transition ${
                isCurrent ? "border-yellow bg-yellow/15" : "border-ink/12 bg-white"
              }`}
            >
              <div className="min-w-0">
                <p className="font-display font-bold text-ink">
                  {plan.name}
                  {isCurrent && (
                    <span className="ml-2 rounded-full bg-yellow px-2 py-0.5 text-xs font-semibold text-ink">Current plan</span>
                  )}
                </p>
                <p className="mt-0.5 text-sm text-ink-soft">
                  {planPrice(plan, annual)}
                  {plan.subtitle ? ` · ${plan.subtitle}` : ""}
                </p>
              </div>
              {plan.price === "custom" ? (
                <Link
                  href="/membership"
                  className="rounded-full bg-ink/5 px-5 py-2 text-sm font-semibold text-ink transition hover:bg-ink/10"
                >
                  Contact us
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={pending || billing || isCurrent}
                  onClick={() => choose(plan)}
                  className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {(pending || billing) && pendingKey === plan.key
                    ? "Please wait…"
                    : isCurrent
                      ? "Selected"
                      : plan.price !== "free" && (annual ? plan.stripePriceAnnualId : plan.stripePriceMonthlyId)
                        ? "Subscribe"
                        : "Choose plan"}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <ErrorText>{error}</ErrorText>
      <ErrorText>{billingError}</ErrorText>
    </Card>
  );
}
