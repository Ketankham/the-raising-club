"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Plus, Trash2 } from "lucide-react";
import { createRegistration, startEventCheckout } from "@/lib/events/actions";
import { priceLabel } from "@/lib/events/format";
import {
  SUPPORT_NEED_LABELS,
  type RegistrationContext,
  type RegistrationPayload,
  type SupportNeed,
} from "@/lib/events/types";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const NOW_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 13 }, (_, i) => NOW_YEAR - i);

interface NewChild {
  petName: string;
  birthMonth: number | "";
  birthYear: number | "";
}

export function RegisterFlow({ context }: { context: RegistrationContext }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const needsChildren = context.participationType !== "adults_only";
  const isDropoff = context.participationType === "children_dropoff";
  const isFree = context.priceModel === "included" || context.priceCents === 0;

  // Step 1 state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [newChildren, setNewChildren] = useState<NewChild[]>([]);
  const [adultCount, setAdultCount] = useState(1);
  const [contactEmail, setContactEmail] = useState(context.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState("");
  const [supportNeeds, setSupportNeeds] = useState<SupportNeed[]>([]);
  const [supportNote, setSupportNote] = useState("");
  const [emergency, setEmergency] = useState({ name: "", phone: "" });
  const [pickup, setPickup] = useState({ name: "", phone: "" });

  // Step 2 state
  const participationWaiver = context.waivers.find((w) => w.kind === "participation");
  const mediaWaiver = context.waivers.find((w) => w.kind === "media_release");
  const [acceptedParticipation, setAcceptedParticipation] = useState(false);
  const [ackedMedia, setAckedMedia] = useState(false);
  const [mediaConsent, setMediaConsent] = useState<"granted" | "declined" | "">("");

  const totalChildren = selectedIds.length + newChildren.length;

  const step1Valid = useMemo(() => {
    if (!contactEmail.trim()) return false;
    if (needsChildren) {
      if (totalChildren === 0) return false;
      if (newChildren.some((c) => c.birthMonth === "" || c.birthYear === "")) return false;
    }
    if (isDropoff) {
      if (!emergency.name.trim() || !emergency.phone.trim()) return false;
      if (!pickup.name.trim() || !pickup.phone.trim()) return false;
    }
    return true;
  }, [contactEmail, needsChildren, totalChildren, newChildren, isDropoff, emergency, pickup]);

  const step2Valid =
    (!participationWaiver || acceptedParticipation) &&
    (!mediaWaiver || (ackedMedia && mediaConsent !== ""));

  function buildPayload(): RegistrationPayload {
    const selected = context.children
      .filter((c) => selectedIds.includes(c.id))
      .map((c) => ({
        childId: c.id,
        petName: c.petName ?? undefined,
        birthMonth: c.birthMonth ?? 0,
        birthYear: c.birthYear ?? 0,
      }));
    const added = newChildren.map((c) => ({
      petName: c.petName || undefined,
      birthMonth: Number(c.birthMonth),
      birthYear: Number(c.birthYear),
    }));
    const waiverAcceptances = [];
    if (participationWaiver) waiverAcceptances.push({ waiverId: participationWaiver.id });
    if (mediaWaiver)
      waiverAcceptances.push({
        waiverId: mediaWaiver.id,
        mediaConsent: (mediaConsent || "declined") as "granted" | "declined",
      });

    return {
      eventId: context.eventId,
      adultCount,
      contactEmail,
      contactPhone: contactPhone || undefined,
      children: needsChildren ? [...selected, ...added] : [],
      supportNeeds,
      supportNote: supportNote || undefined,
      emergencyContact: isDropoff ? { ...emergency } : undefined,
      pickup: isDropoff ? { ...pickup } : undefined,
      waiverAcceptances,
    };
  }

  function submit() {
    setError(null);
    start(async () => {
      const res = await createRegistration(buildPayload());
      if (res.ok) {
        router.push(`/events/${context.slug}`);
        router.refresh();
      } else if (res.reason === "unauthenticated") {
        router.push(`/sign-in?next=/events/${context.slug}/register`);
      } else if (res.reason === "already_registered") {
        router.push(`/events/${context.slug}`);
      } else if (res.reason === "payment_required") {
        setError("This is a paid event — online payment is coming soon.");
      } else {
        setError(res.message ?? "Something went wrong. Please try again.");
      }
    });
  }

  function payAndRegister() {
    setError(null);
    start(async () => {
      const res = await startEventCheckout(buildPayload());
      if (res.ok) {
        window.location.href = res.url;
      } else if (res.reason === "unauthenticated") {
        router.push(`/sign-in?next=/events/${context.slug}/register`);
      } else if (res.reason === "already_registered") {
        router.push(`/events/${context.slug}`);
      } else {
        setError(res.message ?? "Could not start checkout. Please try again.");
      }
    });
  }

  const steps = ["Who's attending", "Consent", isFree ? "Confirm" : "Payment"];

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 lg:px-8">
      <Link
        href={`/events/${context.slug}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={16} /> Back to event
      </Link>

      <h1 className="font-display text-2xl font-bold text-ink">{context.title}</h1>

      {/* Stepper */}
      <ol className="my-6 flex items-center gap-2">
        {steps.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                i < step
                  ? "bg-[#9cc766] text-white"
                  : i === step
                    ? "bg-ink text-white"
                    : "bg-lavender text-ink-soft"
              }`}
            >
              {i < step ? <Check size={14} /> : i + 1}
            </span>
            <span className={`text-xs font-semibold ${i === step ? "text-ink" : "text-ink-soft"}`}>
              {label}
            </span>
            {i < steps.length - 1 && <span className="h-px flex-1 bg-black/10" />}
          </li>
        ))}
      </ol>

      {error && (
        <div className="mb-5 rounded-xl bg-pink px-4 py-3 text-sm text-ink">{error}</div>
      )}

      {/* STEP 1 */}
      {step === 0 && (
        <div className="space-y-6">
          {needsChildren ? (
            <>
              <section>
                <h2 className="mb-1 font-display text-lg font-bold text-ink">Who&apos;s coming?</h2>
                <p className="mb-3 text-sm text-ink-soft">
                  Select the children attending, or add a new one.
                </p>
                <div className="space-y-2">
                  {context.children.map((c) => (
                    <label
                      key={c.id}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(c.id)}
                        onChange={() =>
                          setSelectedIds((s) =>
                            s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id],
                          )
                        }
                        className="h-4 w-4 accent-[#9cc766]"
                      />
                      <span className="text-ink">
                        {c.petName || "Child"}
                        {c.birthMonth && c.birthYear ? (
                          <span className="text-ink-soft">
                            {" "}
                            · {MONTHS[c.birthMonth - 1]} {c.birthYear}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  ))}
                </div>

                {newChildren.map((c, i) => (
                  <div
                    key={i}
                    className="mt-2 flex items-end gap-2 rounded-xl border border-ink/10 bg-white px-4 py-3"
                  >
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-semibold text-ink-soft">
                        Name / nickname (optional)
                      </label>
                      <input
                        value={c.petName}
                        onChange={(e) =>
                          setNewChildren((arr) =>
                            arr.map((x, j) => (j === i ? { ...x, petName: e.target.value } : x)),
                          )
                        }
                        className="w-full rounded-lg border border-ink/15 px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-ink-soft">Month</label>
                      <select
                        value={c.birthMonth}
                        onChange={(e) =>
                          setNewChildren((arr) =>
                            arr.map((x, j) =>
                              j === i ? { ...x, birthMonth: Number(e.target.value) } : x,
                            ),
                          )
                        }
                        className="rounded-lg border border-ink/15 px-2 py-1.5 text-sm"
                      >
                        <option value="">—</option>
                        {MONTHS.map((m, mi) => (
                          <option key={m} value={mi + 1}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-ink-soft">Year</label>
                      <select
                        value={c.birthYear}
                        onChange={(e) =>
                          setNewChildren((arr) =>
                            arr.map((x, j) =>
                              j === i ? { ...x, birthYear: Number(e.target.value) } : x,
                            ),
                          )
                        }
                        className="rounded-lg border border-ink/15 px-2 py-1.5 text-sm"
                      >
                        <option value="">—</option>
                        {YEARS.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      aria-label="Remove child"
                      onClick={() => setNewChildren((arr) => arr.filter((_, j) => j !== i))}
                      className="mb-1 grid h-8 w-8 place-items-center rounded-lg text-ink-soft hover:bg-lavender"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setNewChildren((arr) => [...arr, { petName: "", birthMonth: "", birthYear: "" }])
                  }
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#7ba84f] hover:underline"
                >
                  <Plus size={16} /> Add a child
                </button>
              </section>

              <section>
                <h3 className="mb-1 text-sm font-semibold text-ink">
                  Anything we should know to support your child well? (Optional)
                </h3>
                <div className="space-y-2">
                  {(Object.keys(SUPPORT_NEED_LABELS) as SupportNeed[]).map((k) => (
                    <label key={k} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={supportNeeds.includes(k)}
                        onChange={() =>
                          setSupportNeeds((s) =>
                            s.includes(k) ? s.filter((x) => x !== k) : [...s, k],
                          )
                        }
                        className="h-4 w-4 accent-[#9cc766]"
                      />
                      {SUPPORT_NEED_LABELS[k]}
                    </label>
                  ))}
                </div>
                {supportNeeds.length > 0 && (
                  <textarea
                    value={supportNote}
                    onChange={(e) => setSupportNote(e.target.value)}
                    rows={2}
                    placeholder="Anything specific you'd like us to know?"
                    className="mt-2 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                  />
                )}
              </section>
            </>
          ) : (
            <section>
              <h2 className="mb-1 font-display text-lg font-bold text-ink">How many attending?</h2>
              <input
                type="number"
                min={1}
                value={adultCount}
                onChange={(e) => setAdultCount(Math.max(1, Number(e.target.value)))}
                className="w-24 rounded-lg border border-ink/15 px-3 py-2 text-sm"
              />
            </section>
          )}

          <section className="grid gap-3 sm:grid-cols-2">
            <Field label="Contact email (for updates & reminders)" required>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Phone (optional)">
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
              />
            </Field>
          </section>

          {isDropoff && (
            <section className="space-y-3 rounded-2xl bg-[#fbf3df] p-4">
              <p className="text-sm font-semibold text-ink">
                This is a drop-off event — please provide an emergency contact and authorized pickup.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Emergency contact name" required>
                  <input
                    value={emergency.name}
                    onChange={(e) => setEmergency((s) => ({ ...s, name: e.target.value }))}
                    className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Emergency contact phone" required>
                  <input
                    value={emergency.phone}
                    onChange={(e) => setEmergency((s) => ({ ...s, phone: e.target.value }))}
                    className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Authorized pickup name" required>
                  <input
                    value={pickup.name}
                    onChange={(e) => setPickup((s) => ({ ...s, name: e.target.value }))}
                    className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Authorized pickup phone" required>
                  <input
                    value={pickup.phone}
                    onChange={(e) => setPickup((s) => ({ ...s, phone: e.target.value }))}
                    className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                  />
                </Field>
              </div>
            </section>
          )}

          <StepNav
            onNext={() => setStep(1)}
            nextDisabled={!step1Valid}
            nextLabel="Continue to consent"
          />
        </div>
      )}

      {/* STEP 2 — consent */}
      {step === 1 && (
        <div className="space-y-6">
          {participationWaiver && (
            <WaiverCard title={participationWaiver.title} body={participationWaiver.body}>
              <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={acceptedParticipation}
                  onChange={(e) => setAcceptedParticipation(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#9cc766]"
                />
                I have read, understand, and agree to the Event Participation &amp; Accident Waiver.
              </label>
            </WaiverCard>
          )}

          {mediaWaiver && (
            <WaiverCard title={mediaWaiver.title} body={mediaWaiver.body}>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-ink">
                  Promotional &amp; marketing use — please choose one:
                </p>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
                  <input
                    type="radio"
                    name="media"
                    checked={mediaConsent === "granted"}
                    onChange={() => setMediaConsent("granted")}
                    className="h-4 w-4 accent-[#9cc766]"
                  />
                  YES — I authorize promotional &amp; marketing use.
                </label>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
                  <input
                    type="radio"
                    name="media"
                    checked={mediaConsent === "declined"}
                    onChange={() => setMediaConsent("declined")}
                    className="h-4 w-4 accent-[#9cc766]"
                  />
                  NO — I do not authorize promotional &amp; marketing use.
                </label>
                <label className="mt-2 flex cursor-pointer items-start gap-2.5 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={ackedMedia}
                    onChange={(e) => setAckedMedia(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#9cc766]"
                  />
                  I confirm I have reviewed and made my selection regarding the Media Release.
                </label>
              </div>
            </WaiverCard>
          )}

          <StepNav
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
            nextDisabled={!step2Valid}
            nextLabel={isFree ? "Continue" : "Continue to payment"}
          />
        </div>
      )}

      {/* STEP 3 — confirm / payment */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-display text-base font-bold text-ink">Total</span>
              <span className="font-display text-xl font-bold text-ink">
                {priceLabel(context.priceModel, context.priceCents, context.currency)}
              </span>
            </div>
            {needsChildren && (
              <p className="mt-2 text-sm text-ink-soft">
                {totalChildren} {totalChildren === 1 ? "child" : "children"} ·{" "}
                {context.requiresApproval ? "Approval required after registering" : "Instant confirmation"}
              </p>
            )}
          </div>

          {isFree ? (
            <StepNav
              onBack={() => setStep(1)}
              onNext={submit}
              nextDisabled={pending}
              nextLabel={pending ? "Confirming…" : "Confirm registration"}
            />
          ) : (
            <StepNav
              onBack={() => setStep(1)}
              onNext={payAndRegister}
              nextDisabled={pending}
              nextLabel={pending ? "Redirecting to checkout…" : "Pay & register"}
            />
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-ink-soft">
        {label}
        {required && <span className="text-primary"> *</span>}
      </span>
      {children}
    </label>
  );
}

function WaiverCard({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <h3 className="mb-2 font-display text-base font-bold text-ink">{title}</h3>
      <div className="mb-4 max-h-44 overflow-y-auto whitespace-pre-line rounded-lg bg-cream p-3 text-xs leading-relaxed text-ink-soft">
        {body}
      </div>
      {children}
    </section>
  );
}

function StepNav({
  onBack,
  onNext,
  nextDisabled,
  nextLabel,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink hover:border-ink/30"
        >
          Back
        </button>
      ) : (
        <span />
      )}
      {onNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="rounded-full bg-[#9cc766] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8bb957] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {nextLabel ?? "Continue"}
        </button>
      )}
    </div>
  );
}
