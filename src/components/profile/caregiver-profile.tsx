"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import {
  Share2, Bookmark, UserPlus, Download, Star, BadgeCheck, Pencil, Check, Award,
  Home, Search, Bell, MessageCircle,
} from "lucide-react";
import { Logo } from "@/components/logo";
import type { CaregiverProfileData } from "@/lib/profile";
import {
  AGE_GROUPS, CARE_SETTINGS, EXPERIENCE_LEVELS, AVAILABILITY_TYPES,
  AVAILABILITY_WINDOWS, AVAILABILITY_OPENNESS, EDUCATION_LEVELS,
} from "@/lib/caregiver-options";
import {
  updateAbout, updateLanguages, updateEducationAndCerts,
  updateAges, updateSettings, updateAvailability, togglePublish,
} from "@/lib/profile-actions";

const initials = (f: string | null, l: string | null, p: string | null) =>
  ((p || f || "?").trim()[0] ?? "?").toUpperCase() + ((l || "").trim()[0] ?? "").toUpperCase();

const inputCls = "w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary";
const saveBtn = "rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50";
const cancelBtn = "rounded-full border border-ink/15 px-3 py-1.5 text-xs text-ink-soft";

function EditBtn({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:text-ink">
      <Pencil className="h-3 w-3" /> {open ? "Close" : "Edit"}
    </button>
  );
}

function Card({ title, owner, open, onEdit, tone = "white", children }: { title?: string; owner?: boolean; open?: boolean; onEdit?: () => void; tone?: "white" | "peach" | "pink" | "cream"; children: ReactNode }) {
  const toneCls = { white: "bg-white border-ink/8", peach: "bg-primary/[0.06] border-primary/20", pink: "bg-pink/50 border-pink", cream: "bg-cream border-ink/8" }[tone];
  return (
    <section className={`rounded-2xl border ${toneCls} p-6`}>
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
          {owner && onEdit && <EditBtn open={!!open} onClick={onEdit} />}
        </div>
      )}
      {children}
    </section>
  );
}

function Chip({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "primary" | "olive" }) {
  const cls = { default: "bg-cream border-ink/10 text-ink", primary: "bg-primary/10 border-primary/25 text-[#b5701f]", olive: "bg-olive/25 border-olive/40 text-ink" }[tone];
  return <span className={`rounded-full border px-3 py-1 text-xs ${cls}`}>{children}</span>;
}

function SubHead({ children }: { children: ReactNode }) {
  return <p className="mb-2 mt-4 text-[0.7rem] font-semibold uppercase tracking-wide text-ink-soft first:mt-0">{children}</p>;
}

function CheckList({ options, value, onChange }: { options: [string, string][]; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div className="grid gap-1.5">
      {options.map(([val, label]) => (
        <label key={val} className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={value.includes(val)} onChange={() => toggle(val)} className="accent-primary" /> {label}
        </label>
      ))}
    </div>
  );
}

function SaveRow({ onCancel, onSave, pending }: { onCancel: () => void; onSave: () => void; pending: boolean }) {
  return <div className="mt-3 flex justify-end gap-2"><button onClick={onCancel} className={cancelBtn}>Cancel</button><button disabled={pending} onClick={onSave} className={saveBtn}>Save</button></div>;
}

const NAV = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Browse caregivers", href: "/connect" },
  { label: "My courses", href: "/courses" },
  { label: "Find jobs", href: "/connect" },
  { label: "My applications", href: "/dashboard" },
  { label: "Chat", href: "/dashboard" },
];

export function CaregiverProfile({ data, isOwner }: { data: CaregiverProfileData; isOwner: boolean }) {
  const [toast, setToast] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const show = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2600); };
  const close = () => setOpen(null);
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => { const r = await fn(); if (r.ok) { show("Changes saved ✓"); close(); } else show(r.error ?? "Error"); });
  const toggle = (s: string) => () => setOpen(open === s ? null : s);

  const [about, setAbout] = useState(data.about ?? "");
  const [headline, setHeadline] = useState(data.headline ?? "");
  const [ages, setAges] = useState(data.ages);
  const [settings, setSettings] = useState(data.settings);
  const [avail, setAvail] = useState(data.availability ?? { types: [], windows: [], openness: [] });
  const [langs, setLangs] = useState(data.languages.map((l) => l.language).join(", "));
  const [eduLevel, setEduLevel] = useState(data.education?.level ?? "");
  const [certs, setCerts] = useState(data.certifications.map((c) => c.name).join("\n"));

  const name = `${data.preferredName || data.firstName || "Caregiver"}${data.lastName ? ` ${isOwner ? data.lastName : data.lastName[0] + "."}` : ""}`;
  const location = [data.zip ? `ZIP ${data.zip}` : null].filter(Boolean).join(" · ") || "Location not set";
  const headlineText = headline || (data.experienceLevel ? `${EXPERIENCE_LEVELS[data.experienceLevel]} of experience` : "Caregiver & Educator");
  const idVerified = data.verifications.some((v) => v.type === "identity" && v.status === "verified");
  const rating = data.reviews.length ? (data.reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / data.reviews.length).toFixed(1) : null;

  const share = () => {
    const url = `${window.location.origin}/profile/${data.userId}`;
    navigator.clipboard?.writeText(url).then(() => show("🔗 Profile link copied")) ?? show(url);
  };

  // Snapshot chips
  const snapshot: string[] = [
    ages.length ? ages.slice(0, 2).map((a) => AGE_GROUPS[a]?.split(" ")[0]).join(" + ") : "",
    data.languages.length ? data.languages.slice(0, 2).map((l) => l.language).join(" + ") : "",
    avail.windows.length ? avail.windows.slice(0, 2).map((w) => AVAILABILITY_WINDOWS[w]).join(" + ") : "",
    data.certifications.length ? data.certifications[0].name : "",
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-cream font-[family-name:var(--font-dm-sans)] text-ink">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-ink/5 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard"><Logo /></Link>
            <nav className="hidden items-center gap-5 lg:flex">
              {NAV.map((n) => (
                <Link key={n.label} href={n.href} className="text-sm font-medium text-ink-soft transition hover:text-ink">{n.label}</Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-ink-soft">
            <Home className="h-5 w-5" /><Search className="h-5 w-5" /><Bell className="h-5 w-5" /><MessageCircle className="h-5 w-5" />
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">{initials(data.firstName, data.lastName, data.preferredName)}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <p className="mb-3 text-sm text-ink-soft">Caregiver Profile</p>

        {/* HERO */}
        <Card>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-lavender">
              {data.avatarUrl ? <img src={data.avatarUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center font-display text-3xl font-bold text-purple">{initials(data.firstName, data.lastName, data.preferredName)}</div>}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-ink">{name}</h1>
                {idVerified && <span className="inline-flex items-center gap-1 rounded-full bg-olive/30 px-2.5 py-1 text-xs font-medium text-[#4f6b15]"><BadgeCheck className="h-3.5 w-3.5" /> Verified Caregiver</span>}
              </div>
              <p className="mt-1 text-ink-soft">{headlineText}</p>
              <p className="mt-1 text-sm text-ink-soft">📍 {location}{data.lookingForPaidWork ? " · Open to work" : ""}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink">
                {rating && <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-yellow text-yellow" /> {rating} <span className="text-ink-soft">({data.reviews.length} reviews)</span></span>}
                {data.experienceLevel && <span>{EXPERIENCE_LEVELS[data.experienceLevel]}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={share} title="Share" className="grid h-9 w-9 place-items-center rounded-full border border-ink/10 text-ink-soft hover:text-ink"><Share2 className="h-4 w-4" /></button>
              {!isOwner && <>
                <button onClick={() => show("Saved ✓")} title="Save" className="grid h-9 w-9 place-items-center rounded-full border border-ink/10 text-ink-soft hover:text-ink"><Bookmark className="h-4 w-4" /></button>
                <button onClick={() => show("📩 Invite sent!")} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"><UserPlus className="h-4 w-4" /> Invite to Role</button>
              </>}
              <button onClick={() => show("PDF export coming soon")} className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-2 text-sm font-medium text-ink hover:border-primary hover:text-primary"><Download className="h-4 w-4" /> CV</button>
            </div>
          </div>
          {isOwner && (
            <button onClick={() => run(() => togglePublish(!data.isPublished))} className={`mt-4 rounded-full px-3 py-1 text-xs font-medium ${data.isPublished ? "bg-olive/30 text-[#4f6b15]" : "bg-cream text-ink-soft"}`}>
              {data.isPublished ? "🌍 Public profile" : "🔒 Private — publish"}
            </button>
          )}
        </Card>

        {/* GRID */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          {/* LEFT */}
          <div className="flex flex-col gap-6">
            <Card title="About me" owner={isOwner} open={open === "about"} onEdit={toggle("about")}>
              {open === "about" ? (
                <div className="flex flex-col gap-2">
                  <input className={inputCls} value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Headline (e.g. Infant & Toddler Caregiver · Calm routines)" />
                  <textarea className={`${inputCls} min-h-[110px]`} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Describe how you support children and families…" />
                  <SaveRow pending={pending} onCancel={close} onSave={() => run(() => updateAbout({ headline, about }))} />
                </div>
              ) : about ? <p className="leading-relaxed text-ink-soft">{about}</p> : <p className="italic text-ink-soft/70">{isOwner ? "Add a short bio so families can get to know you…" : "No bio yet."}</p>}
            </Card>

            <Card title="Child Development & Learning" owner={isOwner} tone="pink">
              {(data.experienceLevel || idVerified || data.earnedSkills.some((s) => s.fromCourse)) ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white"><Star className="h-3.5 w-3.5 fill-white" /> TRC Certified Pro</span>
              ) : null}
              {data.earnedSkills.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.earnedSkills.map((s) => (
                    <span key={s.id} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${s.fromCourse ? "bg-primary/15 font-medium text-ink" : "bg-white/70 text-ink-soft"}`}>
                      {s.fromCourse && <Award className="h-3 w-3 text-primary" />} {s.label}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-ink-soft">{isOwner ? "Complete a Raising Club course to earn skills that appear here and in marketplace search." : "No skills added yet."}</p>
              )}
              {data.earnedSkills.some((s) => s.fromCourse) && (
                <p className="mt-3 text-xs italic text-ink-soft">Skills marked with a badge were earned by completing Raising Club courses.</p>
              )}
            </Card>

            <Card title="Education & Credentials" owner={isOwner} open={open === "edu"} onEdit={toggle("edu")}>
              {open === "edu" ? (
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-ink-soft">Education level</label>
                  <select className={inputCls} value={eduLevel} onChange={(e) => setEduLevel(e.target.value)}>
                    <option value="">Select…</option>{Object.entries(EDUCATION_LEVELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <label className="text-xs text-ink-soft">Certifications (one per line)</label>
                  <textarea className={`${inputCls} min-h-[80px]`} value={certs} onChange={(e) => setCerts(e.target.value)} />
                  <SaveRow pending={pending} onCancel={close} onSave={() => run(() => updateEducationAndCerts({ level: eduLevel, certifications: certs.split("\n").map((s) => s.trim()).filter(Boolean) }))} />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {data.education?.level && <div className="text-sm"><span className="font-medium text-ink">{EDUCATION_LEVELS[data.education.level]}</span>{data.education.institution ? <span className="text-ink-soft"> · {data.education.institution}</span> : ""}</div>}
                  {data.certifications.length ? <div className="flex flex-wrap gap-2">{data.certifications.map((c) => <span key={c.id} className="inline-flex items-center gap-1 rounded-full bg-olive/25 px-3 py-1 text-xs text-ink"><Check className="h-3 w-3 text-[#4f6b15]" /> {c.name}</span>)}</div> : null}
                  {data.courseCredentials.length ? (
                    <div className="flex flex-col gap-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">The Raising Club courses</p>
                      {data.courseCredentials.map((c) => (
                        <a key={c.certificateId} href={`/courses/${c.courseSlug}/certificate`} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-primary">
                          <Award className="h-4 w-4 text-primary" /> {c.courseTitle}
                          <span className="text-xs text-ink-soft">· {new Date(c.issuedAt).getFullYear()}</span>
                        </a>
                      ))}
                    </div>
                  ) : null}
                  {!data.education?.level && !data.certifications.length && !data.courseCredentials.length && <p className="text-sm text-ink-soft">{isOwner ? "Add your education and certifications." : "Not added yet."}</p>}
                </div>
              )}
            </Card>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col gap-6">
            <Card title="Snapshot" tone="cream">
              {snapshot.length ? <div className="flex flex-col gap-2">{snapshot.map((s, i) => <div key={i} className="flex items-center gap-2 text-sm text-ink"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> {s}</div>)}</div> : <p className="text-sm text-ink-soft">Add ages, languages & availability to build your snapshot.</p>}
            </Card>

            <Card title="Experience and Skills" owner={isOwner} open={open === "exp"} onEdit={toggle("exp")} tone="peach">
              {open === "exp" ? (
                <div className="flex flex-col gap-3">
                  <SubHead>Age groups</SubHead>
                  <CheckList options={Object.entries(AGE_GROUPS)} value={ages} onChange={setAges} />
                  <div className="flex justify-end"><button disabled={pending} onClick={() => run(() => updateAges(ages))} className={saveBtn}>Save ages</button></div>
                  <SubHead>Care settings &amp; skills</SubHead>
                  <CheckList options={Object.entries(CARE_SETTINGS)} value={settings} onChange={setSettings} />
                  <SaveRow pending={pending} onCancel={close} onSave={() => run(() => updateSettings(settings))} />
                </div>
              ) : (
                <>
                  <SubHead>Age groups</SubHead>
                  <div className="flex flex-wrap gap-2">{data.ages.length ? data.ages.map((a) => <Chip key={a} tone="primary">{AGE_GROUPS[a]}</Chip>) : <span className="text-sm text-ink-soft">—</span>}</div>
                  <SubHead>Specialized experience</SubHead>
                  <div className="flex flex-wrap gap-2">{data.settings.filter((s) => ["tutoring_enrichment", "nanny_share", "live_in"].includes(s)).map((s) => <Chip key={s} tone="olive">{CARE_SETTINGS[s]}</Chip>) || null}{!data.settings.some((s) => ["tutoring_enrichment", "nanny_share", "live_in"].includes(s)) && <span className="text-sm text-ink-soft">—</span>}</div>
                  <SubHead>Settings &amp; skills</SubHead>
                  <div className="flex flex-wrap gap-2">{data.settings.length ? data.settings.map((s) => <Chip key={s}>{CARE_SETTINGS[s]}</Chip>) : <span className="text-sm text-ink-soft">—</span>}</div>
                </>
              )}
            </Card>

            <Card title="Availability & Languages" owner={isOwner} open={open === "avail"} onEdit={toggle("avail")}>
              {open === "avail" ? (
                <div className="flex flex-col gap-3">
                  <SubHead>Availability type</SubHead>
                  <CheckList options={Object.entries(AVAILABILITY_TYPES)} value={avail.types} onChange={(v) => setAvail({ ...avail, types: v })} />
                  <SubHead>Windows</SubHead>
                  <CheckList options={Object.entries(AVAILABILITY_WINDOWS)} value={avail.windows} onChange={(v) => setAvail({ ...avail, windows: v })} />
                  <SubHead>Openness</SubHead>
                  <CheckList options={Object.entries(AVAILABILITY_OPENNESS)} value={avail.openness} onChange={(v) => setAvail({ ...avail, openness: v })} />
                  <div className="flex justify-end"><button disabled={pending} onClick={() => run(() => updateAvailability(avail))} className={saveBtn}>Save availability</button></div>
                  <SubHead>Languages (comma separated)</SubHead>
                  <input className={inputCls} value={langs} onChange={(e) => setLangs(e.target.value)} />
                  <SaveRow pending={pending} onCancel={close} onSave={() => run(() => updateLanguages(langs.split(",").map((s) => s.trim()).filter(Boolean)))} />
                </div>
              ) : (
                <>
                  <SubHead>Availability</SubHead>
                  <div className="flex flex-wrap gap-2">{[...(data.availability?.types ?? []).map((v) => AVAILABILITY_TYPES[v]), ...(data.availability?.windows ?? []).map((v) => AVAILABILITY_WINDOWS[v])].filter(Boolean).map((l, i) => <Chip key={i}>{l}</Chip>)}{!data.availability && <span className="text-sm text-ink-soft">—</span>}</div>
                  <SubHead>Languages</SubHead>
                  <div className="flex flex-wrap gap-2">{data.languages.length ? data.languages.map((l) => <Chip key={l.language}>{l.language}</Chip>) : <span className="text-sm text-ink-soft">—</span>}</div>
                </>
              )}
            </Card>
          </div>
        </div>

        {/* HIGHLIGHTS */}
        <Card title="Highlights from Families & Programs">
          {data.reviews.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.reviews.map((r) => (
                <div key={r.id} className="rounded-xl border border-ink/8 bg-cream p-4">
                  <div className="mb-1 flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3.5 w-3.5 ${i < (r.rating ?? 0) ? "fill-yellow text-yellow" : "text-ink/15"}`} />)}</div>
                  <p className="text-sm text-ink">&ldquo;{r.body}&rdquo;</p>
                  <p className="mt-2 text-xs text-ink-soft">— {r.reviewer_name ?? "A family"}{r.relationship ? `, ${r.relationship}` : ""}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-soft">No reviews yet. {isOwner ? "Invite a past family or employer to leave a short review." : ""}</p>
          )}
        </Card>
      </main>

      <div className={`fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-white shadow-xl transition-all ${toast ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"}`}>{toast}</div>
    </div>
  );
}
