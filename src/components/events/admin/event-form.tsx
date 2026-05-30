"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { createEvent, updateEvent } from "@/lib/events/admin-actions";
import type { EditableEvent } from "@/lib/events/admin";
import {
  EVENT_STYLE_LABELS,
  PARTICIPATION_LABELS,
  type EventFormInput,
  type EventJoinMode,
  type EventStyle,
  type EventStatus,
  type EventVisibility,
  type ParticipationType,
  type PriceModel,
} from "@/lib/events/types";

type OrgOption = { id: string; name: string };

// datetime-local needs "YYYY-MM-DDTHH:mm"; trim a stored ISO string to that.
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

export function EventForm({
  initial,
  orgs,
  isAdmin,
}: {
  initial: EditableEvent | null;
  orgs: OrgOption[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [f, setF] = useState<EventFormInput>(() => ({
    id: initial?.id,
    orgId: orgs.length ? orgs[0].id : null,
    title: initial?.title ?? "",
    summary: initial?.summary ?? "",
    whatToExpect: initial?.whatToExpect ?? "",
    heroImageUrl: initial?.heroImageUrl ?? "",
    joinMode: (initial?.joinMode as EventJoinMode) ?? "in_person",
    style: (initial?.style as EventStyle) ?? "open_play",
    participationType: (initial?.participationType as ParticipationType) ?? "children_with_adult",
    ageMinMonths: initial?.ageMinMonths ?? null,
    ageMaxMonths: initial?.ageMaxMonths ?? null,
    priceModel: (initial?.priceModel as PriceModel) ?? "included",
    priceCents: initial?.priceCents ?? 0,
    childCapacity: initial?.childCapacity ?? null,
    adultCapacity: initial?.adultCapacity ?? null,
    visibility: (initial?.visibility as EventVisibility) ?? "public",
    status: (initial?.status as EventStatus) ?? "draft",
    requiresApproval: initial?.requiresApproval ?? false,
    waitlistEnabled: initial?.waitlistEnabled ?? false,
    isFeatured: initial?.isFeatured ?? false,
    timezone: initial?.timezone ?? "America/New_York",
    startsAt: toLocalInput(initial?.session?.startsAt),
    endsAt: toLocalInput(initial?.session?.endsAt),
    location: {
      kind: (initial?.location?.kind as "physical" | "digital") ?? "physical",
      neighborhood: initial?.location?.neighborhood ?? "",
      address: initial?.location?.address ?? "",
      arrivalNotes: initial?.location?.arrivalNotes ?? "",
      platform: initial?.location?.platform ?? "zoom",
      joinUrl: initial?.location?.joinUrl ?? "",
    },
    resources: (initial?.resources ?? []).map((r) => ({
      label: r.label,
      url: r.url ?? "",
      kind: r.kind,
    })),
    instructors: (initial?.instructors ?? []).map((i) => ({
      name: i.name ?? "",
      roleLabel: i.roleLabel ?? "",
      bio: i.bio ?? "",
      avatarUrl: i.avatarUrl ?? "",
    })),
  }));

  const set = <K extends keyof EventFormInput>(k: K, v: EventFormInput[K]) =>
    setF((s) => ({ ...s, [k]: v }));
  const setLoc = (patch: Partial<EventFormInput["location"]>) =>
    setF((s) => ({ ...s, location: { ...s.location, ...patch } }));

  // Resources (max 5 external links)
  const addResource = () =>
    setF((s) =>
      s.resources.length >= 5
        ? s
        : { ...s, resources: [...s.resources, { label: "", url: "", kind: "link" }] },
    );
  const setResource = (i: number, patch: Partial<EventFormInput["resources"][number]>) =>
    setF((s) => ({
      ...s,
      resources: s.resources.map((r, j) => (j === i ? { ...r, ...patch } : r)),
    }));
  const removeResource = (i: number) =>
    setF((s) => ({ ...s, resources: s.resources.filter((_, j) => j !== i) }));

  // Instructors
  const addInstructor = () =>
    setF((s) => ({
      ...s,
      instructors: [...s.instructors, { name: "", roleLabel: "", bio: "", avatarUrl: "" }],
    }));
  const setInstructor = (i: number, patch: Partial<EventFormInput["instructors"][number]>) =>
    setF((s) => ({
      ...s,
      instructors: s.instructors.map((x, j) => (j === i ? { ...x, ...patch } : x)),
    }));
  const removeInstructor = (i: number) =>
    setF((s) => ({ ...s, instructors: s.instructors.filter((_, j) => j !== i) }));

  function submit() {
    setError(null);
    if (!f.title.trim()) {
      setError("Title is required.");
      return;
    }
    const payload: EventFormInput = {
      ...f,
      startsAt: f.startsAt || null,
      endsAt: f.endsAt || null,
    };
    start(async () => {
      const res = f.id ? await updateEvent(payload) : await createEvent(payload);
      if (res.ok) router.push(`/admin/events/${res.id}/roster`);
      else if (res.reason === "forbidden") setError("You don't have permission to manage this event.");
      else if (res.reason === "unauthenticated") router.push("/sign-in");
      else setError(res.message ?? "Something went wrong.");
    });
  }

  return (
    <div className="space-y-6">
      {error && <div className="rounded-xl bg-pink px-4 py-3 text-sm text-ink">{error}</div>}

      <Section title="Basics">
        <Field label="Title" required>
          <input className={input} value={f.title} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label="Short summary">
          <input className={input} value={f.summary} onChange={(e) => set("summary", e.target.value)} />
        </Field>
        <Field label="What to expect">
          <textarea className={input} rows={4} value={f.whatToExpect} onChange={(e) => set("whatToExpect", e.target.value)} />
        </Field>
        <Field label="Hero image URL">
          <input className={input} value={f.heroImageUrl} onChange={(e) => set("heroImageUrl", e.target.value)} />
        </Field>
        {isAdmin ? null : (
          <Field label="Hosting organization">
            <select className={input} value={f.orgId ?? ""} onChange={(e) => set("orgId", e.target.value || null)}>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </Field>
        )}
      </Section>

      <Section title="Format & eligibility">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="How you'll join">
            <select className={input} value={f.joinMode} onChange={(e) => set("joinMode", e.target.value as EventJoinMode)}>
              <option value="in_person">In-person</option>
              <option value="online">Online</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </Field>
          <Field label="Event style">
            <select className={input} value={f.style ?? ""} onChange={(e) => set("style", e.target.value as EventStyle)}>
              {(Object.keys(EVENT_STYLE_LABELS) as EventStyle[]).map((k) => (
                <option key={k} value={k}>{EVENT_STYLE_LABELS[k]}</option>
              ))}
            </select>
          </Field>
          <Field label="Who attends">
            <select className={input} value={f.participationType} onChange={(e) => set("participationType", e.target.value as ParticipationType)}>
              {(Object.keys(PARTICIPATION_LABELS) as ParticipationType[]).map((k) => (
                <option key={k} value={k}>{PARTICIPATION_LABELS[k]}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Min age (months)">
              <input type="number" min={0} className={input} value={f.ageMinMonths ?? ""} onChange={(e) => set("ageMinMonths", e.target.value === "" ? null : Number(e.target.value))} />
            </Field>
            <Field label="Max age (months)">
              <input type="number" min={0} className={input} value={f.ageMaxMonths ?? ""} onChange={(e) => set("ageMaxMonths", e.target.value === "" ? null : Number(e.target.value))} />
            </Field>
          </div>
        </div>
      </Section>

      <Section title="When">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starts">
            <input type="datetime-local" className={input} value={f.startsAt ?? ""} onChange={(e) => set("startsAt", e.target.value)} />
          </Field>
          <Field label="Ends">
            <input type="datetime-local" className={input} value={f.endsAt ?? ""} onChange={(e) => set("endsAt", e.target.value)} />
          </Field>
          <Field label="Time zone">
            <input className={input} value={f.timezone} onChange={(e) => set("timezone", e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="Where">
        <div className="mb-3 flex gap-2">
          {(["physical", "digital"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setLoc({ kind: k })}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                f.location.kind === k ? "bg-ink text-white" : "bg-lavender text-ink"
              }`}
            >
              {k === "physical" ? "In-person" : "Online"}
            </button>
          ))}
        </div>
        {f.location.kind === "physical" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Neighborhood (shown first)">
              <input className={input} value={f.location.neighborhood} onChange={(e) => setLoc({ neighborhood: e.target.value })} />
            </Field>
            <Field label="Address">
              <input className={input} value={f.location.address} onChange={(e) => setLoc({ address: e.target.value })} />
            </Field>
            <Field label="Arrival / parking notes">
              <input className={input} value={f.location.arrivalNotes} onChange={(e) => setLoc({ arrivalNotes: e.target.value })} />
            </Field>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Platform">
              <select className={input} value={f.location.platform} onChange={(e) => setLoc({ platform: e.target.value })}>
                <option value="zoom">Zoom</option>
                <option value="google_meet">Google Meet</option>
                <option value="vimeo">Vimeo</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Join URL">
              <input className={input} value={f.location.joinUrl} onChange={(e) => setLoc({ joinUrl: e.target.value })} />
            </Field>
          </div>
        )}
      </Section>

      <Section title="Resources (links)">
        <p className="-mt-2 mb-1 text-xs text-ink-soft">
          Up to 5 external links (websites, Vimeo, Google Docs/Drive) shared with registered attendees.
        </p>
        {f.resources.map((r, i) => (
          <div key={i} className="flex flex-wrap items-end gap-2 rounded-xl border border-ink/10 bg-cream/40 p-3">
            <div className="min-w-[140px] flex-1">
              <Field label="Label">
                <input className={input} value={r.label} onChange={(e) => setResource(i, { label: e.target.value })} placeholder="Welcome guide" />
              </Field>
            </div>
            <div className="min-w-[180px] flex-[2]">
              <Field label="URL">
                <input className={input} value={r.url} onChange={(e) => setResource(i, { url: e.target.value })} placeholder="https://…" />
              </Field>
            </div>
            <div>
              <Field label="Type">
                <select className={input} value={r.kind} onChange={(e) => setResource(i, { kind: e.target.value })}>
                  <option value="link">Link</option>
                  <option value="vimeo">Vimeo</option>
                  <option value="gdoc">Google Doc</option>
                  <option value="gdrive">Google Drive</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </div>
            <button type="button" aria-label="Remove resource" onClick={() => removeResource(i)} className="mb-1 grid h-9 w-9 place-items-center rounded-lg text-ink-soft hover:bg-lavender">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {f.resources.length < 5 && (
          <button type="button" onClick={addResource} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7ba84f] hover:underline">
            <Plus size={16} /> Add link
          </button>
        )}
      </Section>

      <Section title="Instructors">
        <p className="-mt-2 mb-1 text-xs text-ink-soft">Shown on the event page.</p>
        {f.instructors.map((it, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-ink/10 bg-cream/40 p-3">
            <div className="flex items-start gap-2">
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <input className={input} value={it.name} onChange={(e) => setInstructor(i, { name: e.target.value })} />
                </Field>
                <Field label="Role / title">
                  <input className={input} value={it.roleLabel} onChange={(e) => setInstructor(i, { roleLabel: e.target.value })} placeholder="Montessori educator" />
                </Field>
              </div>
              <button type="button" aria-label="Remove instructor" onClick={() => removeInstructor(i)} className="mt-6 grid h-9 w-9 place-items-center rounded-lg text-ink-soft hover:bg-lavender">
                <Trash2 size={16} />
              </button>
            </div>
            <Field label="Avatar image URL">
              <input className={input} value={it.avatarUrl} onChange={(e) => setInstructor(i, { avatarUrl: e.target.value })} placeholder="https://…" />
            </Field>
            <Field label="Short bio">
              <textarea className={input} rows={2} value={it.bio} onChange={(e) => setInstructor(i, { bio: e.target.value })} />
            </Field>
          </div>
        ))}
        <button type="button" onClick={addInstructor} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7ba84f] hover:underline">
          <Plus size={16} /> Add instructor
        </button>
      </Section>

      <Section title="Pricing & capacity">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pricing">
            <select className={input} value={f.priceModel} onChange={(e) => set("priceModel", e.target.value as PriceModel)}>
              <option value="included">Included (free)</option>
              <option value="paid">Paid</option>
              <option value="donation">Pay what you can</option>
            </select>
          </Field>
          {f.priceModel === "paid" && (
            <Field label="Price (USD)">
              <input type="number" min={0} step="0.01" className={input}
                value={f.priceCents ? f.priceCents / 100 : ""}
                onChange={(e) => set("priceCents", Math.round(Number(e.target.value) * 100))} />
            </Field>
          )}
          <Field label="Child capacity (blank = unlimited)">
            <input type="number" min={0} className={input} value={f.childCapacity ?? ""} onChange={(e) => set("childCapacity", e.target.value === "" ? null : Number(e.target.value))} />
          </Field>
          <Field label="Adult capacity (blank = unlimited)">
            <input type="number" min={0} className={input} value={f.adultCapacity ?? ""} onChange={(e) => set("adultCapacity", e.target.value === "" ? null : Number(e.target.value))} />
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap gap-5">
          <Toggle label="Requires approval" checked={f.requiresApproval} onChange={(v) => set("requiresApproval", v)} />
          <Toggle label="Enable waitlist" checked={f.waitlistEnabled} onChange={(v) => set("waitlistEnabled", v)} />
          <Toggle label="Featured" checked={f.isFeatured} onChange={(v) => set("isFeatured", v)} />
        </div>
      </Section>

      <Section title="Visibility">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Visibility">
            <select className={input} value={f.visibility} onChange={(e) => set("visibility", e.target.value as EventVisibility)}>
              <option value="public">Public</option>
              <option value="private">Private (invite only)</option>
            </select>
          </Field>
          <Field label="Status">
            <select className={input} value={f.status} onChange={(e) => set("status", e.target.value as EventStatus)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
        </div>
      </Section>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.push("/admin/events")} className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink">
          Cancel
        </button>
        <button type="button" onClick={submit} disabled={pending} className="rounded-full bg-[#9cc766] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#8bb957] disabled:opacity-50">
          {pending ? "Saving…" : f.id ? "Save changes" : "Create event"}
        </button>
      </div>
    </div>
  );
}

const input =
  "w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-[#9cc766]";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <h2 className="mb-4 font-display text-base font-bold text-ink">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
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

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[#9cc766]" />
      {label}
    </label>
  );
}
