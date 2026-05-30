"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { Share2, Mail, Check, Pencil, Lock } from "lucide-react";
import type { CaregiverProfileData } from "@/lib/profile";
import {
  AGE_GROUPS, CARE_SETTINGS, EXPERIENCE_TYPES, EXPERIENCE_LEVELS,
  AVAILABILITY_TYPES, AVAILABILITY_WINDOWS, AVAILABILITY_OPENNESS, EDUCATION_LEVELS,
} from "@/lib/caregiver-options";
import {
  updateAbout, updateContact, updateLanguages, updateEducationAndCerts,
  updateAges, updateSettings, updateExperience, updateAvailability, togglePublish,
} from "@/lib/profile-actions";

/* palette: forest #3a5a45 · terr #c4724a · sand #ede5d8 · cream #faf6f1 · blush #e8c9b4 · sage #7a9e7e · ink #1e2a23 · mist #6b7c72 */

function initials(first: string | null, last: string | null, preferred: string | null) {
  const a = (preferred || first || "?").trim()[0] ?? "?";
  const b = (last || "").trim()[0] ?? "";
  return (a + b).toUpperCase();
}

function Toast({ msg }: { msg: string | null }) {
  return (
    <div
      className={`fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#1e2a23] px-6 py-3 text-sm font-medium text-white shadow-xl transition-all ${msg ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"}`}
    >
      {msg}
    </div>
  );
}

function Card({ title, owner, onEdit, children, editing }: { title: string; owner: boolean; onEdit?: () => void; children: ReactNode; editing?: boolean }) {
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

function Tag({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "forest" | "terr" }) {
  const cls = {
    default: "bg-[#faf6f1] border-[#ede5d8] text-[#1e2a23]",
    forest: "bg-[#e8f4ea] border-[#c3dfc8] text-[#3a5a45]",
    terr: "bg-[#fff3ed] border-[#f5cbb0] text-[#c4724a]",
  }[tone];
  return <span className={`rounded-full border px-3 py-1 text-[.8rem] ${cls}`}>{children}</span>;
}

function CheckList({ options, value, onChange }: { options: [string, string][]; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div className="grid gap-2">
      {options.map(([val, label]) => (
        <label key={val} className="flex items-center gap-2 text-[.85rem] text-[#1e2a23]">
          <input type="checkbox" checked={value.includes(val)} onChange={() => toggle(val)} className="accent-[#3a5a45]" />
          {label}
        </label>
      ))}
    </div>
  );
}

const inputCls = "w-full rounded-lg border-[1.5px] border-[#ede5d8] bg-white px-3 py-2 text-[.88rem] text-[#1e2a23] outline-none focus:border-[#3a5a45]";
const saveBtn = "rounded-full bg-[#3a5a45] px-4 py-1.5 text-[.82rem] font-medium text-white transition hover:bg-[#2d4a36] disabled:opacity-50";
const cancelBtn = "rounded-full border border-[#ede5d8] px-3 py-1.5 text-[.82rem] text-[#6b7c72]";

function SaveRow({ onCancel, onSave, pending }: { onCancel: () => void; onSave: () => void; pending: boolean }) {
  return (
    <div className="mt-3 flex justify-end gap-2">
      <button onClick={onCancel} className={cancelBtn}>Cancel</button>
      <button onClick={onSave} disabled={pending} className={saveBtn}>{pending ? "Saving…" : "Save"}</button>
    </div>
  );
}

export function CaregiverProfile({ data, isOwner }: { data: CaregiverProfileData; isOwner: boolean }) {
  const [toast, setToast] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const show = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2600); };
  const close = () => setOpenSection(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    start(async () => {
      const r = await fn();
      if (r.ok) { show("Changes saved ✓"); close(); }
      else show(r.error ?? "Something went wrong");
    });
  }

  // editable local state
  const [about, setAbout] = useState(data.about ?? "");
  const [headline, setHeadline] = useState(data.headline ?? "");
  const [ages, setAges] = useState(data.ages);
  const [settings, setSettings] = useState(data.settings);
  const [exp, setExp] = useState(data.experienceTypes);
  const [avail, setAvail] = useState(data.availability ?? { types: [], windows: [], openness: [] });
  const [langs, setLangs] = useState(data.languages.map((l) => l.language).join(", "));
  const [eduLevel, setEduLevel] = useState(data.education?.level ?? "");
  const [certs, setCerts] = useState(data.certifications.map((c) => c.name).join("\n"));
  const [phone, setPhone] = useState(data.phone ?? "");
  const [zip, setZip] = useState(data.zip ?? "");

  const displayName = `${data.preferredName || data.firstName || "Caregiver"}${data.lastName ? ` ${isOwner ? data.lastName : data.lastName[0] + "."}` : ""}`;
  const location = data.zip ? `ZIP ${data.zip}` : "Location not set";
  const tagline = headline || (data.experienceLevel ? `${EXPERIENCE_LEVELS[data.experienceLevel]} of experience` : "Caregiver & Educator");
  const idVerified = data.verifications.some((v) => v.type === "identity" && v.status === "verified");

  function shareProfile() {
    const url = `${window.location.origin}/profile/${data.userId}`;
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => show("🔗 Profile link copied to clipboard"));
    else show("🔗 " + url);
  }

  const isOpen = (s: string) => openSection === s;
  const editToggle = (s: string) => () => setOpenSection(isOpen(s) ? null : s);

  return (
    <div className="min-h-screen bg-[#faf6f1] font-[family-name:var(--font-dm-sans)] text-[#1e2a23]">
      {/* NAV */}
      <nav className="flex items-center justify-between border-b border-[#ede5d8] bg-white px-6 py-4 sm:px-10">
        <Link href="/" className="font-serif text-xl text-[#3a5a45]">The Raising <span className="italic text-[#c4724a]">Club</span></Link>
        <div className="flex items-center gap-3">
          {isOwner ? (
            <button onClick={shareProfile} className="rounded-full border-[1.5px] border-[#3a5a45] px-4 py-2 text-[.85rem] font-medium text-[#3a5a45] transition hover:bg-[#3a5a45] hover:text-white">Share</button>
          ) : (
            <Link href="/onboarding" className="rounded-full bg-[#c4724a] px-4 py-2 text-[.85rem] font-medium text-white transition hover:bg-[#b06240]">Join free</Link>
          )}
        </div>
      </nav>

      {/* HERO */}
      <div className="relative h-[180px] overflow-hidden" style={{ background: "linear-gradient(135deg,#3a5a45 0%,#2d4a36 50%,#4a6e52 100%)" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 80% at 80% 50%, rgba(196,114,74,.35) 0%, transparent 60%)" }} />
      </div>

      <div className="mx-auto max-w-[900px] px-6 pb-20">
        {/* AVATAR STRIP */}
        <div className="-mt-[52px] mb-6 flex flex-wrap items-end gap-5">
          <div className="h-[104px] w-[104px] shrink-0 overflow-hidden rounded-full border-4 border-white bg-[#e8c9b4] shadow-[0_4px_24px_rgba(30,42,35,.08)]">
            {data.avatarUrl ? (
              <img src={data.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-serif text-[2.5rem] text-[#c4724a]">{initials(data.firstName, data.lastName, data.preferredName)}</div>
            )}
          </div>
          <div className="flex-1 pb-2">
            <h1 className="font-serif text-[1.85rem] font-semibold leading-tight text-[#1e2a23]">{displayName}</h1>
            <p className="mt-1 text-[.9rem] text-[#6b7c72]">{tagline} · {location}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2.5 pb-2.5">
            <button onClick={shareProfile} className="flex items-center gap-1.5 rounded-full border-[1.5px] border-[#ede5d8] bg-white px-4 py-2 text-[.85rem] font-medium text-[#1e2a23] transition hover:border-[#3a5a45] hover:text-[#3a5a45]">
              <Share2 className="h-3.5 w-3.5" /> Share profile
            </button>
            {!isOwner && (
              <button onClick={() => show("📩 Connection request sent!")} className="flex items-center gap-1.5 rounded-full bg-[#3a5a45] px-5 py-2 text-[.85rem] font-medium text-white transition hover:bg-[#2d4a36]">
                <Mail className="h-3.5 w-3.5" /> Contact {data.preferredName || data.firstName}
              </button>
            )}
          </div>
        </div>

        {/* BADGES */}
        <div className="mb-6 flex flex-wrap gap-2">
          {idVerified && <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f4ea] px-3 py-1 text-[.78rem] font-medium text-[#3a5a45]"><Check className="h-3 w-3" /> Identity verified</span>}
          {data.experienceLevel && <span className="rounded-full bg-[#ede5d8] px-3 py-1 text-[.78rem] font-medium text-[#1e2a23]">🌿 {EXPERIENCE_LEVELS[data.experienceLevel]} experience</span>}
          <span className="rounded-full bg-[#ede5d8] px-3 py-1 text-[.78rem] font-medium text-[#1e2a23]">📍 {location}</span>
          {data.lookingForPaidWork && <span className="rounded-full border border-[#f5cbb0] bg-[#fff3ed] px-3 py-1 text-[.78rem] font-medium text-[#c4724a]">● Open to work</span>}
          {isOwner && (
            <button onClick={() => run(() => togglePublish(!data.isPublished))} className={`rounded-full px-3 py-1 text-[.78rem] font-medium ${data.isPublished ? "bg-[#e8f4ea] text-[#3a5a45]" : "bg-[#ede5d8] text-[#6b7c72]"}`}>
              {data.isPublished ? "🌍 Public" : "🔒 Private — publish"}
            </button>
          )}
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_300px]">
          {/* LEFT */}
          <div className="flex flex-col gap-5">
            {/* ABOUT */}
            <Card title="About" owner={isOwner} editing={isOpen("about")} onEdit={editToggle("about")}>
              {isOpen("about") ? (
                <div className="flex flex-col gap-2">
                  <input className={inputCls} value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Headline (e.g. Infant & Toddler Caregiver · Calm routines)" />
                  <textarea className={`${inputCls} min-h-[110px]`} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Write a short bio about your care philosophy and what families can expect…" />
                  <SaveRow pending={pending} onCancel={close} onSave={() => run(() => updateAbout({ headline, about }))} />
                </div>
              ) : about ? (
                <p className="text-[.92rem] leading-[1.7] text-[#6b7c72]">{about}</p>
              ) : (
                <p className="text-[.9rem] italic text-[#aab4ad]">{isOwner ? "✏️ Add a short bio so families can get to know you…" : "No bio yet."}</p>
              )}
            </Card>

            {/* EXPERIENCE */}
            <Card title="Experience with children" owner={isOwner} editing={isOpen("exp")} onEdit={editToggle("exp")}>
              {isOpen("exp") ? (
                <>
                  <CheckList options={Object.entries(EXPERIENCE_TYPES).map(([v, o]) => [v, o.label])} value={exp} onChange={setExp} />
                  <SaveRow pending={pending} onCancel={close} onSave={() => run(() => updateExperience(exp))} />
                </>
              ) : data.experienceTypes.length ? (
                <div>
                  {data.experienceTypes.map((t) => {
                    const o = EXPERIENCE_TYPES[t];
                    return (
                      <div key={t} className="flex gap-3 border-b border-[#ede5d8] py-3 last:border-none last:pb-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#ede5d8] text-base">{o?.icon ?? "🌿"}</div>
                        <div>
                          <div className="text-[.88rem] font-semibold text-[#1e2a23]">{o?.label ?? t}</div>
                          {o?.sub && <div className="mt-0.5 text-[.8rem] text-[#6b7c72]">{o.sub}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-[.85rem] text-[#6b7c72]">Not added yet.</p>}
            </Card>

            {/* WHO I CARE FOR */}
            <Card title="Who I feel comfortable caring for" owner={isOwner} editing={isOpen("ages")} onEdit={editToggle("ages")}>
              {isOpen("ages") ? (
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="mb-2 text-[.82rem] text-[#6b7c72]">Ages &amp; stages</p>
                    <CheckList options={Object.entries(AGE_GROUPS)} value={ages} onChange={setAges} />
                    <div className="mt-2 flex justify-end"><button onClick={() => run(() => updateAges(ages))} disabled={pending} className={saveBtn}>Save ages</button></div>
                  </div>
                  <div>
                    <p className="mb-2 text-[.82rem] text-[#6b7c72]">Care settings</p>
                    <CheckList options={Object.entries(CARE_SETTINGS)} value={settings} onChange={setSettings} />
                    <SaveRow pending={pending} onCancel={close} onSave={() => run(() => updateSettings(settings))} />
                  </div>
                </div>
              ) : (
                <>
                  <p className="mb-3 text-[.82rem] text-[#6b7c72]">Ages &amp; stages</p>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {data.ages.length ? data.ages.map((a) => <Tag key={a} tone="forest">{AGE_GROUPS[a] ?? a}</Tag>) : <span className="text-[.85rem] text-[#6b7c72]">—</span>}
                  </div>
                  <p className="mb-3 text-[.82rem] text-[#6b7c72]">Care settings</p>
                  <div className="flex flex-wrap gap-2">
                    {data.settings.length ? data.settings.map((s) => <Tag key={s}>{CARE_SETTINGS[s] ?? s}</Tag>) : <span className="text-[.85rem] text-[#6b7c72]">—</span>}
                  </div>
                </>
              )}
            </Card>

            {/* AVAILABILITY */}
            <Card title="Availability" owner={isOwner} editing={isOpen("avail")} onEdit={editToggle("avail")}>
              {isOpen("avail") ? (
                <div className="flex flex-col gap-3">
                  <p className="text-[.82rem] text-[#6b7c72]">Availability type</p>
                  <CheckList options={Object.entries(AVAILABILITY_TYPES)} value={avail.types} onChange={(v) => setAvail({ ...avail, types: v })} />
                  <p className="text-[.82rem] text-[#6b7c72]">Typical availability</p>
                  <CheckList options={Object.entries(AVAILABILITY_WINDOWS)} value={avail.windows} onChange={(v) => setAvail({ ...avail, windows: v })} />
                  <p className="text-[.82rem] text-[#6b7c72]">Additional openness</p>
                  <CheckList options={Object.entries(AVAILABILITY_OPENNESS)} value={avail.openness} onChange={(v) => setAvail({ ...avail, openness: v })} />
                  <SaveRow pending={pending} onCancel={close} onSave={() => run(() => updateAvailability(avail))} />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {[...(data.availability?.types ?? []).map((v) => AVAILABILITY_TYPES[v]), ...(data.availability?.windows ?? []).map((v) => AVAILABILITY_WINDOWS[v]), ...(data.availability?.openness ?? []).map((v) => AVAILABILITY_OPENNESS[v])].filter(Boolean).map((label, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-[10px] border border-[#ede5d8] bg-[#faf6f1] px-3.5 py-2.5 text-[.82rem]">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[#7a9e7e]" />{label}
                    </div>
                  ))}
                  {!data.availability && <p className="text-[.85rem] text-[#6b7c72]">Not added yet.</p>}
                </div>
              )}
            </Card>

            {/* TRAINING */}
            <Card title="Training & certifications" owner={isOwner} editing={isOpen("train")} onEdit={editToggle("train")}>
              {isOpen("train") ? (
                <div className="flex flex-col gap-2">
                  <label className="text-[.82rem] text-[#6b7c72]">Education level</label>
                  <select className={inputCls} value={eduLevel} onChange={(e) => setEduLevel(e.target.value)}>
                    <option value="">Select…</option>
                    {Object.entries(EDUCATION_LEVELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <label className="text-[.82rem] text-[#6b7c72]">Training &amp; certifications (one per line)</label>
                  <textarea className={`${inputCls} min-h-[90px]`} value={certs} onChange={(e) => setCerts(e.target.value)} />
                  <SaveRow pending={pending} onCancel={close} onSave={() => run(() => updateEducationAndCerts({ level: eduLevel, certifications: certs.split("\n").map((s) => s.trim()).filter(Boolean) }))} />
                </div>
              ) : data.certifications.length ? (
                <div className="flex flex-wrap gap-2">{data.certifications.map((c) => <Tag key={c.id} tone="terr">{c.name}</Tag>)}</div>
              ) : <p className="text-[.85rem] text-[#6b7c72]">No certifications added yet.</p>}
            </Card>

            {/* LANGUAGES */}
            <Card title="Languages" owner={isOwner} editing={isOpen("lang")} onEdit={editToggle("lang")}>
              {isOpen("lang") ? (
                <div className="flex flex-col gap-2">
                  <input className={inputCls} value={langs} onChange={(e) => setLangs(e.target.value)} placeholder="English, Spanish, Hindi…" />
                  <p className="text-[.78rem] text-[#6b7c72]">Separate languages with commas. The first is your primary.</p>
                  <SaveRow pending={pending} onCancel={close} onSave={() => run(() => updateLanguages(langs.split(",").map((s) => s.trim()).filter(Boolean)))} />
                </div>
              ) : data.languages.length ? (
                <div className="flex flex-wrap gap-2">{data.languages.map((l) => <Tag key={l.language}>{l.language}{l.is_primary ? " ·primary" : ""}</Tag>)}</div>
              ) : <p className="text-[.85rem] text-[#6b7c72]">No languages added yet.</p>}
            </Card>
          </div>

          {/* SIDEBAR */}
          <div className="flex flex-col gap-5">
            {/* AT A GLANCE */}
            <Card title="At a glance" owner={false}>
              {[
                ["Experience", data.experienceLevel ? EXPERIENCE_LEVELS[data.experienceLevel] : "—"],
                ["Location", location],
                ["Education", data.education?.level ? EDUCATION_LEVELS[data.education.level] : "—"],
                ["Languages", data.languages.length ? `${data.languages.length} language${data.languages.length === 1 ? "" : "s"}` : "—"],
                ["Member since", data.registeredAt ? new Date(data.registeredAt).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "—"],
                ["Status", data.lookingForPaidWork ? "● Open to work" : "Community"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-b border-[#ede5d8] py-2.5 text-[.88rem] last:border-none">
                  <span className="text-[#6b7c72]">{k}</span>
                  <span className={`font-semibold ${v === "● Open to work" ? "text-[#c4724a]" : "text-[#1e2a23]"}`}>{v}</span>
                </div>
              ))}
            </Card>

            {/* CONTACT */}
            <Card title="Contact info" owner={isOwner} editing={isOpen("contact")} onEdit={editToggle("contact")}>
              {isOwner ? (
                isOpen("contact") ? (
                  <div className="flex flex-col gap-2">
                    <input className={inputCls} value={data.email ?? ""} disabled placeholder="Email" />
                    <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
                    <input className={inputCls} value={zip} onChange={(e) => setZip(e.target.value)} placeholder="ZIP code" />
                    <SaveRow pending={pending} onCancel={close} onSave={() => run(() => updateContact({ phone, zip }))} />
                  </div>
                ) : (
                  <div>
                    {data.email && <div className="flex items-center gap-2.5 border-b border-[#ede5d8] py-2.5 text-[.88rem] last:border-none"><Mail className="h-4 w-4 text-[#6b7c72]" />{data.email}</div>}
                    {data.phone && <div className="flex items-center gap-2.5 border-b border-[#ede5d8] py-2.5 text-[.88rem] last:border-none">📱 {data.phone}</div>}
                    {data.zip && <div className="flex items-center gap-2.5 py-2.5 text-[.88rem]">📍 ZIP {data.zip}</div>}
                  </div>
                )
              ) : (
                <div className="rounded-[10px] border border-dashed border-[#e8c9b4] bg-[#faf6f1] p-4 text-center">
                  <Lock className="mx-auto mb-2 h-6 w-6 text-[#6b7c72]" />
                  <p className="text-[.82rem] leading-relaxed text-[#6b7c72]">Contact details are only shared after a match or connection is made.</p>
                  <button onClick={() => show("📩 Connection request sent!")} className="mt-3 w-full rounded-lg bg-[#3a5a45] py-2.5 text-[.85rem] font-medium text-white transition hover:bg-[#2d4a36]">Request to connect</button>
                </div>
              )}
            </Card>

            {/* REVIEWS */}
            <Card title="Reviews" owner={false}>
              {data.reviews.length ? (
                <div className="flex flex-col gap-3">
                  {data.reviews.map((r) => (
                    <div key={r.id} className="border-b border-[#ede5d8] pb-3 last:border-none">
                      <p className="text-[.85rem] text-[#1e2a23]">&ldquo;{r.body}&rdquo;</p>
                      <p className="mt-1 text-[.78rem] text-[#6b7c72]">— {r.reviewer_name ?? "A family"}{r.relationship ? `, ${r.relationship}` : ""}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <p className="mb-3.5 text-[.85rem] leading-relaxed text-[#6b7c72]">No reviews yet. Ask a past family or employer to leave a short review.</p>
                  {isOwner && <button onClick={() => show("Invite review flow coming soon")} className="w-full rounded-full border-[1.5px] border-[#ede5d8] bg-white py-2 text-[.82rem] font-medium text-[#1e2a23] transition hover:border-[#3a5a45] hover:text-[#3a5a45]">⭐ Invite a review</button>}
                </>
              )}
            </Card>

            {/* STRENGTHEN (owner) */}
            {isOwner && (
              <div className="rounded-[14px] p-5 text-white" style={{ background: "linear-gradient(135deg,#3a5a45,#2d4a36)" }}>
                <h3 className="mb-1.5 font-serif text-base">Strengthen your profile</h3>
                <p className="mb-3.5 text-[.8rem] leading-relaxed opacity-80">Optional steps that help families feel confident in you.</p>
                {["Complete identity verification", "Run a background check", "Invite your first review"].map((t) => (
                  <button key={t} onClick={() => show("Coming soon")} className="mb-2 flex w-full items-center gap-2.5 rounded-lg bg-white/10 px-3 py-2.5 text-left text-[.82rem] transition last:mb-0 hover:bg-white/20">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#e8c9b4]" /> {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Toast msg={toast} />
    </div>
  );
}
