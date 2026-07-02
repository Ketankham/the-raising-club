"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createAccount, updateProfileDetails, completeStep } from "@/lib/onboarding/actions";
import { StepHeading, ErrorText, Field, inputClass } from "./ui";
import { PlacesAutocomplete } from "@/components/ui/places-autocomplete";
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
  // Revisit after the account was created (back navigation): the form becomes
  // an editable summary — no email/password/terms, and Continue just saves.
  const registered = state.completedSteps.includes("profile");
  const details = state.profileDetails;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    first_name: details.firstName ?? "",
    last_name: details.lastName ?? "",
    preferred_name: details.preferredName ?? "",
    org_name: (state.answers.org_name as string | undefined) ?? "",
    contactRoleTitle: (state.answers.contactRoleTitle as string | undefined) ?? "director",
    contactRoleOther: (state.answers.contactRoleOther as string | undefined) ?? "",
    email: "",
    password: "",
    phone: details.phone ?? "",
    child_term: (state.answers.child_term as string | undefined) ?? "",
  });
  const [location, setLocation] = useState<{
    zip_code: string;
    lat: number | null;
    lng: number | null;
  }>({ zip_code: details.zipCode ?? "", lat: null, lng: null });
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit() {
    setError(null);
    if (!registered) {
      if (!form.email || !form.password) return setError("Email and password are required.");
      if (form.password.length < 8) return setError("Password must be at least 8 characters.");
      if (!agreed) return setError("Please agree to the Terms & Conditions to continue.");
    }
    if (role === "organization" && !form.org_name) return setError("Organization name is required.");

    start(async () => {
      const profile = {
        first_name: form.first_name || undefined,
        last_name: form.last_name || undefined,
        preferred_name: form.preferred_name || undefined,
        phone: form.phone || undefined,
        zip_code: location.zip_code || undefined,
        lat: location.lat ?? undefined,
        lng: location.lng ?? undefined,
      };

      const account = registered
        ? await updateProfileDetails(profile)
        : await createAccount({ email: form.email, password: form.password, profile });
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
      <StepHeading title={registered ? "Your profile" : "Set up your profile"} />
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

        {registered ? (
          <Field label="Email">
            <input type="email" className={inputClass} value={details.email ?? ""} disabled readOnly />
          </Field>
        ) : (
          <>
            <Field label="Email">
              <input type="email" className={inputClass} value={form.email} onChange={set("email")} />
            </Field>
            <Field label="Password" hint="At least 8 characters.">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={inputClass}
                  style={{ paddingRight: "2.75rem" }}
                  value={form.password}
                  onChange={set("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  onMouseDown={(e) => e.preventDefault()}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-4 flex items-center text-ink-soft transition hover:text-ink"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </Field>
          </>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={role === "organization" ? "Program location" : "Your area"}
            hint="Start typing a city, neighborhood, or ZIP code"
          >
            <PlacesAutocomplete
              placeholder={role === "organization" ? "e.g. Brooklyn, NY" : "e.g. Chicago, IL or 60601"}
              types={["geocode"]}
              initialValue={location.zip_code}
              className={inputClass}
              onPlace={(p) =>
                setLocation({
                  zip_code: p.zipCode ?? p.city ?? p.formatted,
                  lat: p.lat,
                  lng: p.lng,
                })
              }
            />
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

        {!registered && (
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            I agree to the{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
              Terms &amp; Conditions
            </a>{" "}
            and{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
              Privacy Policy
            </a>.
          </label>
        )}
      </div>

      <ErrorText>{error}</ErrorText>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="rounded-lg bg-primary px-8 py-3 font-display font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? (registered ? "Saving…" : "Creating account…") : registered ? "Continue" : "Create Account"}
        </button>
      </div>
    </div>
  );
}
