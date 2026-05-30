"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { Share2, Pencil, Check, MapPin, Users, Briefcase, LayoutDashboard } from "lucide-react";
import type { OrgProfileData } from "@/lib/org-profile";
import { AGE_GROUPS } from "@/lib/caregiver-options";
import { updateOrgAbout, updateOrgProgram, toggleOrgPublish } from "@/lib/org-profile-actions";

const PROGRAM_TYPES: Record<string, string> = {
  daycare: "Daycare / Childcare center", preschool: "Preschool", afterschool: "After-school program",
  weekend_enrichment: "Weekend / enrichment", learning_pod: "Learning pod / microschool", other: "Other",
};
const PROGRAM_SIZE: Record<string, string> = { "1_5": "1–5 staff", "6_10": "6–10 staff", "11_25": "11–25 staff", "26_plus": "26+ staff" };

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "TRC";
}

const inputCls = "w-full rounded-lg border-[1.5px] border-[#ede5d8] bg-white px-3 py-2 text-[.88rem] text-[#1e2a23] outline-none focus:border-[#3a5a45]";
const saveBtn = "rounded-full bg-[#3a5a45] px-4 py-1.5 text-[.82rem] font-medium text-white transition hover:bg-[#2d4a36] disabled:opacity-50";
const cancelBtn = "rounded-full border border-[#ede5d8] px-3 py-1.5 text-[.82rem] text-[#6b7c72]";

function Card({ title, owner, editing, onEdit, children }: { title: string; owner?: boolean; editing?: boolean; onEdit?: () => void; children: ReactNode }) {
  return (
    <div className="rounded-[14px] border border-[#ede5d8] bg-white p-6 transition hover:shadow-[0_4px_24px_rgba(30,42,35,.08)]">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-serif text-[1.05rem] font-semibold text-[#1e2a23]">{title}</span>
        {owner && onEdit && (
          <button onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-full bg-[#ede5d8] px-3 py-1.5 text-xs font-medium text-[#1e2a23] transition hover:bg-[#e8c9b4]">
            <Pencil className="h-3 w-3" /> {editing ? "Close" : "Edit"}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Tag({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "forest" }) {
  const cls = tone === "forest" ? "bg-[#e8f4ea] border-[#c3dfc8] text-[#3a5a45]" : "bg-[#faf6f1] border-[#ede5d8] text-[#1e2a23]";
  return <span className={`rounded-full border px-3 py-1 text-[.8rem] ${cls}`}>{children}</span>;
}

function CheckList({ options, value, onChange }: { options: [string, string][]; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map(([val, label]) => (
        <label key={val} className="flex items-center gap-2 text-[.85rem] text-[#1e2a23]">
          <input type="checkbox" checked={value.includes(val)} onChange={() => toggle(val)} className="accent-[#3a5a45]" /> {label}
        </label>
      ))}
    </div>
  );
}

export function OrgProfile({ data, isOwner }: { data: OrgProfileData; isOwner: boolean }) {
  const [toast, setToast] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const show = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2600); };
  const close = () => setOpen(null);
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => { const r = await fn(); if (r.ok) { show("Changes saved ✓"); close(); } else show(r.error ?? "Error"); });

  const [about, setAbout] = useState(data.about ?? "");
  const [types, setTypes] = useState(data.programTypes);
  const [ages, setAges] = useState(data.agesServed);
  const [size, setSize] = useState(data.size ?? "");
  const [multi, setMulti] = useState(data.multiLocation);

  const location = data.locations[0]?.zip_code ? `ZIP ${data.locations[0].zip_code}` : (data.multiLocation ? "Multiple locations" : "Location not set");
  const tagline = data.programTypes.length ? data.programTypes.map((t) => PROGRAM_TYPES[t] ?? t).slice(0, 2).join(" · ") : "Childcare program";

  function share() {
    const url = `${window.location.origin}/organization/${data.orgId}`;
    navigator.clipboard?.writeText(url).then(() => show("🔗 Program link copied")) ?? show(url);
  }

  return (
    <div className="min-h-screen bg-[#faf6f1] font-[family-name:var(--font-dm-sans)] text-[#1e2a23]">
      <nav className="flex items-center justify-between border-b border-[#ede5d8] bg-white px-6 py-4 sm:px-10">
        <Link href="/" className="font-serif text-xl text-[#3a5a45]">The Raising <span className="italic text-[#c4724a]">Club</span></Link>
        {isOwner ? (
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-[#3a5a45] px-4 py-2 text-[.85rem] font-medium text-[#3a5a45] transition hover:bg-[#3a5a45] hover:text-white">
            <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
          </Link>
        ) : (
          <Link href="/onboarding" className="rounded-full bg-[#c4724a] px-4 py-2 text-[.85rem] font-medium text-white transition hover:bg-[#b06240]">Join free</Link>
        )}
      </nav>

      <div className="relative h-[180px] overflow-hidden" style={{ background: "linear-gradient(135deg,#3a5a45 0%,#2d4a36 50%,#4a6e52 100%)" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 80% at 80% 50%, rgba(196,114,74,.35) 0%, transparent 60%)" }} />
      </div>

      <div className="mx-auto max-w-[900px] px-6 pb-20">
        <div className="-mt-[52px] mb-6 flex flex-wrap items-end gap-5">
          <div className="flex h-[104px] w-[104px] shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-[#e8c9b4] font-serif text-[2.2rem] text-[#c4724a] shadow-[0_4px_24px_rgba(30,42,35,.08)]">{initials(data.name)}</div>
          <div className="flex-1 pb-2">
            <h1 className="font-serif text-[1.85rem] font-semibold leading-tight text-[#1e2a23]">{data.name}</h1>
            <p className="mt-1 text-[.9rem] text-[#6b7c72]">{tagline} · {location}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2.5 pb-2.5">
            <button onClick={share} className="flex items-center gap-1.5 rounded-full border-[1.5px] border-[#ede5d8] bg-white px-4 py-2 text-[.85rem] font-medium text-[#1e2a23] transition hover:border-[#3a5a45] hover:text-[#3a5a45]">
              <Share2 className="h-3.5 w-3.5" /> Share
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {data.programTypes.map((t) => <span key={t} className="rounded-full bg-[#ede5d8] px-3 py-1 text-[.78rem] font-medium text-[#1e2a23]">{PROGRAM_TYPES[t] ?? t}</span>)}
          {data.size && <span className="rounded-full bg-[#ede5d8] px-3 py-1 text-[.78rem] font-medium text-[#1e2a23]">👥 {PROGRAM_SIZE[data.size]}</span>}
          <span className="rounded-full bg-[#ede5d8] px-3 py-1 text-[.78rem] font-medium text-[#1e2a23]">📍 {data.multiLocation ? "Multiple locations" : "Single location"}</span>
          {isOwner && (
            <button onClick={() => run(() => toggleOrgPublish(!data.isPublished))} className={`rounded-full px-3 py-1 text-[.78rem] font-medium ${data.isPublished ? "bg-[#e8f4ea] text-[#3a5a45]" : "bg-[#ede5d8] text-[#6b7c72]"}`}>
              {data.isPublished ? "🌍 Discoverable" : "🔒 Private — publish"}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_300px]">
          <div className="flex flex-col gap-5">
            <Card title="About the program" owner={isOwner} editing={open === "about"} onEdit={() => setOpen(open === "about" ? null : "about")}>
              {open === "about" ? (
                <div className="flex flex-col gap-2">
                  <textarea className={`${inputCls} min-h-[110px]`} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Describe your program's approach, values, and what makes it a great place for children and staff…" />
                  <div className="flex justify-end gap-2"><button onClick={close} className={cancelBtn}>Cancel</button><button disabled={pending} onClick={() => run(() => updateOrgAbout(about))} className={saveBtn}>Save</button></div>
                </div>
              ) : data.about ? <p className="text-[.92rem] leading-[1.7] text-[#6b7c72]">{data.about}</p> : <p className="text-[.9rem] italic text-[#aab4ad]">{isOwner ? "✏️ Add a description so families and caregivers understand your program…" : "No description yet."}</p>}
            </Card>

            <Card title="Programs & ages served" owner={isOwner} editing={open === "program"} onEdit={() => setOpen(open === "program" ? null : "program")}>
              {open === "program" ? (
                <div className="flex flex-col gap-4">
                  <div><p className="mb-2 text-[.82rem] text-[#6b7c72]">Program type</p><CheckList options={Object.entries(PROGRAM_TYPES)} value={types} onChange={setTypes} /></div>
                  <div><p className="mb-2 text-[.82rem] text-[#6b7c72]">Ages served</p><CheckList options={Object.entries(AGE_GROUPS)} value={ages} onChange={setAges} /></div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="text-[.82rem] text-[#6b7c72]">Size</label>
                    <select className={inputCls + " max-w-[180px]"} value={size} onChange={(e) => setSize(e.target.value)}>
                      <option value="">Select…</option>{Object.entries(PROGRAM_SIZE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <label className="flex items-center gap-2 text-[.85rem]"><input type="checkbox" checked={multi} onChange={(e) => setMulti(e.target.checked)} className="accent-[#3a5a45]" /> Multiple locations</label>
                  </div>
                  <div className="flex justify-end gap-2"><button onClick={close} className={cancelBtn}>Cancel</button><button disabled={pending} onClick={() => run(() => updateOrgProgram({ programTypes: types, agesServed: ages, size: size || null, multiLocation: multi }))} className={saveBtn}>Save</button></div>
                </div>
              ) : (
                <>
                  <p className="mb-3 text-[.82rem] text-[#6b7c72]">Programs</p>
                  <div className="mb-4 flex flex-wrap gap-2">{data.programTypes.length ? data.programTypes.map((t) => <Tag key={t} tone="forest">{PROGRAM_TYPES[t] ?? t}</Tag>) : <span className="text-[.85rem] text-[#6b7c72]">—</span>}</div>
                  <p className="mb-3 text-[.82rem] text-[#6b7c72]">Ages served</p>
                  <div className="flex flex-wrap gap-2">{data.agesServed.length ? data.agesServed.map((a) => <Tag key={a}>{AGE_GROUPS[a] ?? a}</Tag>) : <span className="text-[.85rem] text-[#6b7c72]">—</span>}</div>
                </>
              )}
            </Card>

            <Card title="Locations">
              {data.locations.length ? (
                <ul className="flex flex-col gap-2">
                  {data.locations.map((l) => (
                    <li key={l.id} className="flex items-center gap-2 text-[.88rem] text-[#1e2a23]"><MapPin className="h-4 w-4 text-[#7a9e7e]" />{l.label || "Location"}{l.zip_code ? ` · ZIP ${l.zip_code}` : ""}{l.is_primary ? " (primary)" : ""}</li>
                  ))}
                </ul>
              ) : <p className="text-[.85rem] text-[#6b7c72]">{data.multiLocation ? "Multiple locations — add details from your dashboard." : "Single location."}</p>}
            </Card>
          </div>

          <div className="flex flex-col gap-5">
            <Card title="At a glance">
              {[["Program size", data.size ? PROGRAM_SIZE[data.size] : "—"], ["Locations", data.multiLocation ? "Multiple" : "Single"], ...(isOwner ? [["Team members", String(data.memberCount)], ["Open roles", String(data.jobs.filter((j) => j.status === "open").length)]] as [string, string][] : [])].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-b border-[#ede5d8] py-2.5 text-[.88rem] last:border-none"><span className="text-[#6b7c72]">{k}</span><span className="font-semibold text-[#1e2a23]">{v}</span></div>
              ))}
            </Card>

            {isOwner ? (
              <div className="rounded-[14px] p-5 text-white" style={{ background: "linear-gradient(135deg,#3a5a45,#2d4a36)" }}>
                <h3 className="mb-1.5 font-serif text-base">Manage your program</h3>
                <p className="mb-3.5 text-[.8rem] leading-relaxed opacity-80">Staff, train, and grow from your dashboard.</p>
                <Link href="/dashboard" className="mb-2 flex items-center gap-2.5 rounded-lg bg-white/10 px-3 py-2.5 text-[.82rem] transition hover:bg-white/20"><LayoutDashboard className="h-4 w-4" /> Go to dashboard</Link>
                <Link href="/organization/team" className="mb-2 flex items-center gap-2.5 rounded-lg bg-white/10 px-3 py-2.5 text-[.82rem] transition hover:bg-white/20"><Users className="h-4 w-4" /> Invite staff</Link>
                <Link href="/organization/roles/new" className="flex items-center gap-2.5 rounded-lg bg-white/10 px-3 py-2.5 text-[.82rem] transition hover:bg-white/20"><Briefcase className="h-4 w-4" /> Post a role</Link>
              </div>
            ) : (
              <Card title="Interested?">
                <p className="mb-3 text-[.85rem] leading-relaxed text-[#6b7c72]">Caregivers and families can connect with this program through The Raising Club.</p>
                <Link href="/onboarding" className="block w-full rounded-lg bg-[#3a5a45] py-2.5 text-center text-[.85rem] font-medium text-white transition hover:bg-[#2d4a36]">Connect</Link>
              </Card>
            )}
          </div>
        </div>
      </div>

      <div className={`fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#1e2a23] px-6 py-3 text-sm font-medium text-white shadow-xl transition-all ${toast ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"}`}>{toast}</div>
    </div>
  );
}
