"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { updateNotificationType } from "@/lib/notifications/actions";
import { renderTemplate } from "@/lib/notifications/render";
import { type NotificationType, type TemplateVar } from "@/lib/notifications/types";

type FieldId = "inappTitle" | "inappBody" | "emailSubject" | "emailBody";

/** Friendly example value for the live preview. Falls back to the var label. */
function sampleValue(token: string, label: string): string {
  const t = token.toLowerCase();
  if (/(firstname|sender|applicant|reviewer)/.test(t)) return "Alex";
  if (t.includes("event") && /(name|title)/.test(t)) return "Parenting 101 Workshop";
  if (t.includes("course") && /(name|title)/.test(t)) return "Foundations of Care";
  if (t.includes("module") && /(name|title)/.test(t)) return "Lesson 3: Routines";
  if (t.includes("job") && /(name|title)/.test(t)) return "Weekend Nanny";
  if (t.includes("date")) return "Jun 12, 2026";
  if (t.includes("timezone")) return "EST";
  if (t.includes("time")) return "3:00 PM";
  if (/(location|link)/.test(t)) return "https://meet.example.com/abc";
  if (t.includes("amount")) return "$25.00";
  if (t.includes("status")) return "accepted";
  return label;
}

function buildSampleVars(vars: TemplateVar[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const v of vars) out[v.token] = sampleValue(v.token, v.label);
  return out;
}

export function NotificationTypeEditor({ type }: { type: NotificationType }) {
  const [form, setForm] = useState({
    inappEnabled: type.inappEnabled,
    emailEnabled: type.emailEnabled,
    ccAdmin: type.ccAdmin,
    inappTitle: type.inappTitle,
    inappBody: type.inappBody,
    emailSubject: type.emailSubject,
    emailBody: type.emailBody,
  });
  const [lastFocused, setLastFocused] = useState<FieldId>("inappBody");
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inappTitleRef = useRef<HTMLInputElement>(null);
  const inappBodyRef = useRef<HTMLTextAreaElement>(null);
  const emailSubjectRef = useRef<HTMLInputElement>(null);
  const emailBodyRef = useRef<HTMLTextAreaElement>(null);

  function refFor(id: FieldId): HTMLInputElement | HTMLTextAreaElement | null {
    if (id === "inappTitle") return inappTitleRef.current;
    if (id === "inappBody") return inappBodyRef.current;
    if (id === "emailSubject") return emailSubjectRef.current;
    return emailBodyRef.current;
  }

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function insertToken(token: string) {
    const id = lastFocused;
    const el = refFor(id);
    const current = form[id] as string;
    const pos = el?.selectionStart ?? current.length;
    const next = `${current.slice(0, pos)}{{${token}}}${current.slice(pos)}`;
    set(id, next);
    requestAnimationFrame(() => {
      const node = refFor(id);
      if (node) {
        node.focus();
        const caret = pos + token.length + 4;
        node.setSelectionRange(caret, caret);
      }
    });
  }

  function save() {
    setError(null);
    start(async () => {
      const res = await updateNotificationType(type.key, form);
      if (res.ok) setSaved(true);
      else setError(res.error);
    });
  }

  const sample = buildSampleVars(type.availableVars);
  const fieldCls =
    "w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/notifications"
          className="inline-flex items-center gap-1 text-sm text-ink-soft transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> All notifications
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">{type.name}</h1>
        {type.description && <p className="mt-1 text-sm text-ink-soft">{type.description}</p>}
        <p className="mt-1 font-mono text-xs text-ink-soft/60">{type.key}</p>
      </div>

      {/* Variable palette */}
      {type.availableVars.length > 0 && (
        <div className="rounded-2xl border border-ink/10 bg-cream/50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Available variables — click to insert into the last-focused field
          </p>
          <div className="flex flex-wrap gap-2">
            {type.availableVars.map((v) => (
              <button
                key={v.token}
                type="button"
                onClick={() => insertToken(v.token)}
                title={v.label}
                className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-white px-2.5 py-1 font-mono text-xs text-ink transition hover:border-primary hover:bg-primary/5"
              >
                <Plus className="h-3 w-3" />
                {`{{${v.token}}}`}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* In-app panel */}
        <section className="rounded-2xl border border-ink/10 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">In-app</h2>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={form.inappEnabled}
                onChange={(e) => set("inappEnabled", e.target.checked)}
                className="h-4 w-4 accent-[var(--color-primary,#e0466e)]"
              />
              Enabled
            </label>
          </div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Title</label>
          <input
            ref={inappTitleRef}
            value={form.inappTitle}
            onFocus={() => setLastFocused("inappTitle")}
            onChange={(e) => set("inappTitle", e.target.value)}
            className={`${fieldCls} mb-3`}
          />
          <label className="mb-1 block text-xs font-medium text-ink-soft">Body</label>
          <textarea
            ref={inappBodyRef}
            value={form.inappBody}
            rows={4}
            onFocus={() => setLastFocused("inappBody")}
            onChange={(e) => set("inappBody", e.target.value)}
            className={fieldCls}
          />
          <p className="mt-3 mb-1 text-xs font-medium text-ink-soft">Preview</p>
          <div className="rounded-xl border border-ink/10 bg-cream/40 p-3">
            <p className="text-sm font-semibold text-ink">
              {renderTemplate(form.inappTitle, sample) || "—"}
            </p>
            <p className="mt-0.5 text-sm text-ink-soft">{renderTemplate(form.inappBody, sample)}</p>
          </div>
        </section>

        {/* Email panel */}
        <section className="rounded-2xl border border-ink/10 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">Email</h2>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={form.emailEnabled}
                onChange={(e) => set("emailEnabled", e.target.checked)}
                className="h-4 w-4 accent-[var(--color-primary,#e0466e)]"
              />
              Enabled
            </label>
          </div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Subject</label>
          <input
            ref={emailSubjectRef}
            value={form.emailSubject}
            onFocus={() => setLastFocused("emailSubject")}
            onChange={(e) => set("emailSubject", e.target.value)}
            className={`${fieldCls} mb-3`}
          />
          <label className="mb-1 block text-xs font-medium text-ink-soft">Body</label>
          <textarea
            ref={emailBodyRef}
            value={form.emailBody}
            rows={8}
            onFocus={() => setLastFocused("emailBody")}
            onChange={(e) => set("emailBody", e.target.value)}
            className={fieldCls}
          />
          <label className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={form.ccAdmin}
              onChange={(e) => set("ccAdmin", e.target.checked)}
              className="h-4 w-4 accent-[var(--color-primary,#e0466e)]"
            />
            CC admin (theraisingclub.tech@gmail.com)
          </label>
          <p className="mt-3 mb-1 text-xs font-medium text-ink-soft">Preview</p>
          <div className="rounded-xl border border-ink/10 bg-cream/40 p-3">
            <p className="text-sm font-semibold text-ink">
              {renderTemplate(form.emailSubject, sample) || "—"}
            </p>
            <pre className="mt-1 whitespace-pre-wrap font-sans text-sm text-ink-soft">
              {renderTemplate(form.emailBody, sample)}
            </pre>
          </div>
          <p className="mt-2 text-xs text-ink-soft/70">
            Email delivery isn&apos;t connected yet — enabling email records the message but does
            not send it.
          </p>
        </section>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={pending}
          className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        {saved && <span className="text-sm text-green-700">Saved.</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  );
}
