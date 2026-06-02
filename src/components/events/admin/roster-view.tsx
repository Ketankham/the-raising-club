"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Check, Mail, Phone, X } from "lucide-react";
import { setAttendanceStatus, setRegistrationStatus } from "@/lib/events/admin-actions";
import { SUPPORT_NEED_LABELS, type SupportNeed } from "@/lib/events/types";
import type { RosterEntry, RosterPayment } from "@/lib/events/admin";

const PAYMENT_STYLES: Record<string, string> = {
  paid: "bg-[#eef6e3] text-[#5f8a36]",
  pending: "bg-[#fdf2e2] text-[#a05014]",
  refunded: "bg-lavender text-ink-soft",
  failed: "bg-pink text-[#a02c4a]",
};

function money(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency || "usd").toUpperCase(),
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

function PaymentChip({ payment }: { payment: RosterPayment }) {
  const refunded = payment.refundedAmountCents > 0;
  const label = refunded
    ? `Refunded ${money(payment.refundedAmountCents, payment.currency)}`
    : payment.status === "paid"
      ? `Paid ${money(payment.amountCents, payment.currency)}`
      : payment.status === "pending"
        ? "Payment pending"
        : payment.status;
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
        PAYMENT_STYLES[refunded ? "refunded" : payment.status] ?? "bg-lavender text-ink-soft"
      }`}
    >
      {label}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-[#eef6e3] text-[#5f8a36]",
  pending: "bg-[#fdf2e2] text-[#a05014]",
  waitlisted: "bg-yellow/50 text-ink",
  denied: "bg-pink text-[#a02c4a]",
  cancelled: "bg-lavender text-ink-soft",
};

const ATT = [
  { value: "registered", label: "Registered" },
  { value: "attended", label: "Attended" },
  { value: "no_show", label: "No-show" },
] as const;

function ageFromMonthYear(month: number | null, year: number | null): string {
  if (!month || !year) return "";
  const now = new Date();
  const months = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month);
  if (months < 0) return "";
  if (months < 24) return `${months} mo`;
  return `${Math.floor(months / 12)} yr`;
}

export function RosterView({ entries, eventId }: { entries: RosterEntry[]; eventId: string }) {
  const totalChildren = entries
    .filter((e) => !["cancelled", "denied"].includes(e.status))
    .reduce((n, e) => n + e.children.length, 0);
  const pendingCount = entries.filter((e) => e.status === "pending").length;

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/15 bg-white/50 p-10 text-center text-sm text-ink-soft">
        No registrations yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">
        {entries.length} {entries.length === 1 ? "registration" : "registrations"} · {totalChildren}{" "}
        {totalChildren === 1 ? "child" : "children"}
        {pendingCount > 0 && (
          <span className="ml-2 rounded-full bg-[#fdf2e2] px-2 py-0.5 text-xs font-semibold text-[#a05014]">
            {pendingCount} awaiting approval
          </span>
        )}
      </p>
      {entries.map((e) => (
        <RegistrationCard key={e.registrationId} entry={e} eventId={eventId} />
      ))}
    </div>
  );
}

function RegistrationCard({ entry, eventId }: { entry: RosterEntry; eventId: string }) {
  const [status, setStatus] = useState(entry.status);
  const [pending, start] = useTransition();

  const decide = (next: "confirmed" | "denied") =>
    start(async () => {
      const res = await setRegistrationStatus(entry.registrationId, next, eventId);
      if (res.ok) setStatus(next);
    });

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3 text-sm text-ink-soft">
          {entry.contactEmail && (
            <span className="flex items-center gap-1.5">
              <Mail size={14} /> {entry.contactEmail}
            </span>
          )}
          {entry.contactPhone && (
            <span className="flex items-center gap-1.5">
              <Phone size={14} /> {entry.contactPhone}
            </span>
          )}
          <span>· {entry.adultCount} adult{entry.adultCount === 1 ? "" : "s"}</span>
        </div>
        <div className="flex items-center gap-2">
          {status === "pending" && (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={() => decide("confirmed")}
                className="inline-flex items-center gap-1 rounded-full bg-[#9cc766] px-3 py-1 text-xs font-semibold text-white transition hover:bg-[#8bb957] disabled:opacity-50"
              >
                <Check size={13} /> Approve
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => decide("denied")}
                className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-3 py-1 text-xs font-semibold text-ink-soft transition hover:border-[#d08] hover:text-[#a02c4a] disabled:opacity-50"
              >
                <X size={13} /> Deny
              </button>
            </>
          )}
          {entry.payment && <PaymentChip payment={entry.payment} />}
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
              STATUS_STYLES[status] ?? "bg-lavender text-ink-soft"
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      <ul className="divide-y divide-black/5">
        {entry.children.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
            <div>
              <span className="font-display text-sm font-bold text-ink">
                {c.petName || "Child"}
              </span>
              <span className="ml-2 text-xs text-ink-soft">
                {ageFromMonthYear(c.birthMonth, c.birthYear)}
              </span>
              {c.supportNeeds.length > 0 && (
                <span
                  className="ml-2 inline-flex items-center gap-1 rounded-full bg-pink px-2 py-0.5 text-[11px] font-semibold text-ink"
                  title={c.supportNeeds.map((s) => SUPPORT_NEED_LABELS[s as SupportNeed] ?? s).join("; ")}
                >
                  <AlertTriangle size={11} /> support needs
                </span>
              )}
            </div>
            <AttendanceControl childId={c.id} initial={c.attendanceStatus} />
          </li>
        ))}
      </ul>

      {(entry.emergencyContacts.length > 0 || entry.pickups.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-black/5 pt-3 text-xs text-ink-soft">
          {entry.emergencyContacts.map((x, i) => (
            <span key={`e${i}`}>Emergency: {x.name} · {x.phone}</span>
          ))}
          {entry.pickups.map((x, i) => (
            <span key={`p${i}`}>Pickup: {x.name} · {x.phone}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function AttendanceControl({ childId, initial }: { childId: string; initial: string }) {
  const [status, setStatus] = useState(initial);
  const [pending, start] = useTransition();

  return (
    <div className="flex gap-1">
      {ATT.map((a) => (
        <button
          key={a.value}
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await setAttendanceStatus(childId, a.value);
              if (res.ok) setStatus(a.value);
            })
          }
          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
            status === a.value
              ? "bg-[#9cc766] text-white"
              : "bg-lavender text-ink-soft hover:text-ink"
          }`}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
