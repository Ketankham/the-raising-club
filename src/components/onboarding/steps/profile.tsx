"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAccount, completeStep } from "@/lib/onboarding/actions";
import { StepHeading, ErrorText, Field, inputClass } from "./ui";
import type { OnboardingState } from "@/lib/onboarding/state";

const ROLE_TITLES = [
  { value: "director", label: "Director" },
  { value: "owner", label: "Owner" },
  { value: "program_manager", label: "Program Manager" },
  { value: "hr_operations", label: "HR / Operations" },
  { value: "other", label: "Other" },
];

export function ProfileStep({ state }: { state: OnboardingState }) {
  const role = state.role ?? "parent";
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    preferred_name: "",
    org_name: "",
    contactRoleTitle: "director",
    contactRoleOther: "",
    email: "",
    password: "",
    zip_code: "",
    phone: "",
    child_term: "",
  });
  const [agreed, setAgreed] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit() {
    setError(null);
    if (!form.email || !form.password) return setError("Email and password are required.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    if (role === "organization" && !form.org_name) return setError("Organization name is required.");
    if (!agreed) return setError("Please agree to the Terms & Conditions to continue.");

    start(async () => {
      const account = await createAccount({
        email: form.email,
        password: form.password,
        profile: {
          first_name: form.first_name || undefined,
          last_name: form.last_name || undefined,
          preferred_name: form.preferred_name || undefined,
          phone: form.phone || undefined,
          zip_code: form.zip_code || undefined,
        },
      });
      if (!account.ok) {
        setError(
          /already|registered|exists/i.test(account.error)
            ? "An account with this email already exists. Please sign in to continue."
            : account.error,
        );
        return;
      }

      const extra =
        role === "parent"
          ? { child_term: form.child_term }
          : role === "organization"
            ? { org_name: form.org_name, contactRoleTitle: form.contactRoleTitle, contactRoleOther: form.contactRoleOther }
            : {};

      const res = await completeStep("profile", extra);
      if (!res.ok) return setError(res.error);
      if (res.data.nextStep) router.push(`/onboarding/${res.data.nextStep}`);
    });
  }

  return (
    <div>
      <StepHeading title="Set up your profile" />
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={role === "caregiver" ? "First name" : "First name or nickname"}>
            <input className={inputClass} value={form.first_name} onChange={set("first_name")} />
          </Field>
          <Field label="Last name">
            <input className={inputClass} value={form.last_name} onChange={set("last_name")} />
          </Field>
        </div>

        {role === "caregiver" && (
          <Field label="What name do you like children and families to use?" hint="This can be a nickname or preferred name (optional).">
            <input className={inputClass} value={form.preferred_name} onChange={set("preferred_name")} />
          </Field>
        )}

        {role === "organization" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="School or organization name">
              <input className={inputClass} value={form.org_name} onChange={set("org_name")} />
            </Field>
            <Field label="Role / Job title">
              <select className={inputClass} value={form.contactRoleTitle} onChange={set("contactRoleTitle")}>
                {ROLE_TITLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </Field>
          </div>
        )}

        <Field label="Email">
          <input type="email" className={inputClass} value={form.email} onChange={set("email")} />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <input type="password" className={inputClass} value={form.password} onChange={set("password")} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={role === "organization" ? "ZIP code (program location)" : "ZIP code"}>
            <input className={inputClass} value={form.zip_code} onChange={set("zip_code")} />
          </Field>
          <Field label="Phone number">
            <input className={inputClass} value={form.phone} onChange={set("phone")} />
          </Field>
        </div>

        {role === "parent" && (
          <Field label="What does your child call you?" hint="For example: Mom, Dad, Mama, Papa, Grandma, Abuela, Tito, or a nickname.">
            <input className={inputClass} value={form.child_term} onChange={set("child_term")} />
          </Field>
        )}

        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          I agree to the Terms &amp; Conditions and Privacy Policy.
        </label>
      </div>

      <ErrorText>{error}</ErrorText>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="rounded-lg bg-primary px-8 py-3 font-display font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? "Creating account…" : "Create Account"}
        </button>
      </div>
    </div>
  );
}
