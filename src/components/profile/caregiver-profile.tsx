"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import {
  Share2, Bookmark, UserPlus, Download, Star, BadgeCheck, Pencil, Check, Award,
  Home, Search, Bell, MessageCircle, ShieldCheck, GraduationCap,
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
import { VerificationStatusCard, VerifyPromptBanner } from "@/components/profile/verification-status-card";

const initials = (f: string | null, l: string | null, p: string | null) =>
  ((p || f || "?").trim()[0] ?? "?").toUpperCase() + ((l || "").trim()[0] ?? "").toUpperCase();

const inputCls = "w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary";
const saveBtn = "rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50";
const cancelBtn = "rounded-full border border-ink/15 px-3 py-1.5 text-xs text-ink-soft";

const TONES: Record<string, string> = {
  white: "bg-white",
  cream: "bg-[#fbf3e7]",
  peach: "bg-[#fdeede]",
  green: "bg-[#e9f0d9]",
  pink: "bg-[#fce9f0]",
  blue: "bg-[#e4eff3]",
};

function Card({ title, owner, open, onEdit, tone = "white", className = "", children }: { title?: string; owner?: boolean; open?: boolean; onEdit?: () => void; tone?: keyof typeof TONES; className?: string; children: ReactNode }) {
  return (
    <section className={`rounded-2xl ${TONES[tone]} p-5 ${className}`}>
      {title && (
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-[0.95rem] font-bold text-ink">{title}</h2>
          {owner && onEdit && (
            <button onClick={onEdit} className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium text-ink-soft transition hover:text-ink">
              <Pencil className="h-3 w-3" /> {open ? "Close" : "Edit"}
            </button>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

function Chip({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "peach" | "olive" | "blue" }) {
  const cls = {
    default: "bg-white/80 text-ink",
    peach: "bg-[#fbdcc4] text-[#9a5a2a]",
    olive: "bg-[#dde7c0] text-[#4f6b15]",
    blue: "bg-white/80 text-[#3a6b7d]",
  }[tone];
  return <span className={`rounded-full px-3 py-1 text-xs ${cls}`}>{children}</span>;
}

function SubHead({ children }: { children: ReactNode }) {
  return <p className="mb-2 mt-4 text-[0.65rem] font-semibold uppercase tracking-wide text-ink-soft first:mt-0">{children}</p>;
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
  { label: "Dashboard home", href: "/dashboard" },
  { label: "Browse courses", href: "/courses" },
  { label: "My courses", href: "/dashboard/courses" },
  { label: "Find jobs", href: "/jobs" },
  { label: "My applications", href: "/dashboard" },
];

const SPECIALIZED = ["tutoring_enrichment", "nanny_share", "live_in"];

function StatPill({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded-full bg-[#fbe9c9] px-3 py-1 text-xs font-medium text-[#7a5a1e]">{children}</span>;
}

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
  const location = data.zip ? `ZIP ${data.zip}` : "Location not set";
  const headlineText = headline || (data.experienceLevel ? `${EXPERIENCE_LEVELS[data.experienceLevel]} of experience` : "Caregiver & Educator");
  const idVerified = data.verifications.some((v) => v.type === "identity" && v.status === "verified");
  const bgVerified = data.backgroundCheckVerified;
  const rating = data.reviews.length ? (data.reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / data.reviews.length).toFixed(1) : null;
  const hasCoursePro = data.earnedSkills.some((s) => s.fromCourse);

  const share = () => {
    const url = `${window.location.origin}/profile/${data.userId}`;
    navigator.clipboard?.writeText(url).then(() => show("🔗 Profile link copied")) ?? show(url);
  };

  const snapshot: { label: string; tone: string }[] = [
    { label: ages.length ? ages.slice(0, 2).map((a) => AGE_GROUPS[a]?.split(" ")[0]).join(" + ") : "", tone: "bg-[#f2b98a]" },
    { label: data.languages.length ? data.languages.slice(0, 2).map((l) => l.language).join(" + ") : "", tone: "bg-[#c7d68f]" },
    { label: avail.windows.length ? avail.windows.slice(0, 2).map((w) => AVAILABILITY_WINDOWS[w]).join(" + ") : "", tone: "bg-[#e7a6c0]" },
    { label: data.certifications.length ? data.certifications[0].name : "", tone: "bg-[#9bc1cf]" },
  ].filter((s) => s.label);

  return (
    <div className="min-h-screen bg-[#faf5ee] font-[family-name:var(--font-dm-sans)] text-ink">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#faf5ee]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard"><Logo /></Link>
            <nav className="hidden items-center gap-5 lg:flex">
              {NAV.map((n) => (
                <Link key={n.label} href={n.href} className={`text-sm font-medium transition ${n.label === "Dashboard home" ? "rounded-full bg-ink px-4 py-1.5 text-white" : "text-ink-soft hover:text-ink"}`}>{n.label}</Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-ink-soft">
            <Home className="h-5 w-5" /><Search className="h-5 w-5" /><Bell className="h-5 w-5" /><MessageCircle className="h-5 w-5" />
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">{initials(data.firstName, data.lastName, data.preferredName)}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-12">
        <p className="mb-4 flex items-center gap-2 text-sm font-medium text-ink-soft"><BadgeCheck className="h-4 w-4" /> Caregiver Profile</p>

        {/* HERO */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-lavender">
            {data.avatarUrl ? <img src={data.avatarUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center font-display text-4xl font-bold text-purple">{initials(data.firstName, data.lastName, data.preferredName)}</div>}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-3xl font-bold text-ink">{name}</h1>
              {idVerified && <span className="inline-flex items-center gap-1 rounded-full bg-[#dcebc6] px-2.5 py-1 text-xs font-semibold text-[#4f6b15]"><BadgeCheck className="h-3.5 w-3.5" /> Verified Caregiver</span>}
              {bgVerified && <span className="inline-flex items-center gap-1 rounded-full bg-[#dce6f0] px-2.5 py-1 text-xs font-semibold text-[#2a4a7a]"><ShieldCheck className="h-3.5 w-3.5" /> Background Checked</span>}
              {isOwner && <button onClick={toggle("about")} className="grid h-7 w-7 place-items-center rounded-lg bg-white/70 text-ink-soft hover:text-ink"><Pencil className="h-3.5 w-3.5" /></button>}
            </div>
            <p className="mt-1 text-ink-soft">{headlineText}</p>
            <p className="mt-1 text-sm text-ink-soft">📍 {location}{data.lookingForPaidWork ? " · Open to work" : ""}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {rating && <StatPill><Star className="h-3.5 w-3.5 fill-[#e0a72e] text-[#e0a72e]" /> {rating} ({data.reviews.length} reviews)</StatPill>}
              {data.experienceLevel && <StatPill>{EXPERIENCE_LEVELS[data.experienceLevel]}</StatPill>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <button onClick={share} title="Share" className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink-soft shadow-sm hover:text-ink"><Share2 className="h-4 w-4" /></button>
              {!isOwner && <button onClick={() => show("📩 Invite sent!")} title="Invite to role" className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink-soft shadow-sm hover:text-ink"><UserPlus className="h-4 w-4" /></button>}
              <button onClick={() => show("Saved ✓")} title="Save" className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink-soft shadow-sm hover:text-ink"><Bookmark className="h-4 w-4" /></button>
            </div>
            <button onClick={() => show("PDF export coming soon")} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7a5a1e] hover:underline"><Download className="h-3.5 w-3.5" /> Download PDF (CV)</button>
            {isOwner && (
              <button onClick={() => run(() => togglePublish(!data.isPublished))} className={`rounded-full px-3 py-1 text-xs font-medium ${data.isPublished ? "bg-[#dcebc6] text-[#4f6b15]" : "bg-white text-ink-soft"}`}>
                {data.isPublished ? "🌍 Public" : "🔒 Private — publish"}
              </button>
            )}
          </div>
        </div>

        {/* Verification prompt banner — shown to owner after onboarding */}
        {isOwner && !idVerified && <div className="mt-5"><VerifyPromptBanner /></div>}

        {/* GRID */}
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
          {/* LEFT WIDE */}
          <div className="flex flex-col gap-5">
            {/* About */}
            <Card title="About me" tone="cream" owner={isOwner} open={open === "about"} onEdit={toggle("about")}>
              {open === "about" ? (
                <div className="flex flex-col gap-2">
                  <input className={inputCls} value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Headline (e.g. Infant & Toddler Caregiver · Calm routines)" />
                  <textarea className={`${inputCls} min-h-[110px]`} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Describe how you support children and families…" />
                  <SaveRow pending={pending} onCancel={close} onSave={() => run(() => updateAbout({ headline, about }))} />
                </div>
              ) : about ? <p className="text-sm leading-relaxed text-ink-soft">{about}</p> : <p className="text-sm italic text-ink-soft/70">{isOwner ? "Add a short bio so families can get to know you…" : "No bio yet."}</p>}
            </Card>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Ages & Experience */}
              <Card title="Ages & Experience" tone="peach" owner={isOwner} open={open === "ages"} onEdit={toggle("ages")}>
                {open === "ages" ? (
                  <div className="flex flex-col gap-2">
                    <CheckList options={Object.entries(AGE_GROUPS)} value={ages} onChange={setAges} />
                    <SaveRow pending={pending} onCancel={close} onSave={() => run(() => updateAges(ages))} />
                  </div>
                ) : (
                  <>
                    <SubHead>Age groups</SubHead>
                    <div className="flex flex-wrap gap-1.5">{data.ages.length ? data.ages.map((a) => <Chip key={a} tone="peach">{AGE_GROUPS[a]}</Chip>) : <span className="text-sm text-ink-soft">—</span>}</div>
                    <SubHead>Specialized experience</SubHead>
                    <div className="flex flex-wrap gap-1.5">
                      {data.settings.filter((s) => SPECIALIZED.includes(s)).map((s) => <Chip key={s} tone="olive">{CARE_SETTINGS[s]}</Chip>)}
                      {!data.settings.some((s) => SPECIALIZED.includes(s)) && <span className="text-sm text-ink-soft">—</span>}
                    </div>
                  </>
                )}
              </Card>

              {/* Child Development & Learning */}
              <Card title="Child Development & Learning" tone="pink">
                {data.earnedSkills.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {data.earnedSkills.map((s) => (
                      <span key={s.id} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${s.fromCourse ? "bg-white font-medium text-ink" : "bg-white/70 text-ink-soft"}`}>
                        {s.fromCourse && <Award className="h-3 w-3 text-primary" />} {s.label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ink-soft">{isOwner ? "Complete a Raising Club course to earn skills shown here." : "No skills added yet."}</p>
                )}
                {hasCoursePro && <p className="mt-3 text-xs italic text-ink-soft">Badged skills were earned by completing Raising Club courses.</p>}
              </Card>

              {/* Safety & Health */}
              <Card title="Safety & Health" tone="green">
                {data.certifications.length ? (
                  <ul className="flex flex-col gap-2">
                    {data.certifications.map((c) => (
                      <li key={c.id} className="flex items-center gap-2 text-sm text-ink"><Check className="h-4 w-4 text-[#4f6b15]" /> {c.name}</li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-ink-soft">{isOwner ? "Add certifications (CPR, First Aid…) in Education & Credentials." : "No certifications added yet."}</p>}
              </Card>

              {/* Education & Credentials */}
              <Card title="Education & Credentials" tone="white" owner={isOwner} open={open === "edu"} onEdit={toggle("edu")}>
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
                  <div className="flex flex-col gap-2.5">
                    {data.education?.level && <div className="flex items-start gap-2 text-sm"><GraduationCap className="mt-0.5 h-4 w-4 text-ink-soft" /><span><span className="font-semibold text-ink">{EDUCATION_LEVELS[data.education.level]}</span>{data.education.institution ? <span className="block text-xs text-ink-soft">{data.education.institution}</span> : null}</span></div>}
                    {data.courseCredentials.map((c) => (
                      <a key={c.certificateId} href={`/courses/${c.courseSlug}/certificate`} className="flex items-center gap-2 text-sm font-medium text-ink hover:text-primary"><Award className="h-4 w-4 text-primary" /> {c.courseTitle} <span className="text-xs text-ink-soft">· {new Date(c.issuedAt).getFullYear()}</span></a>
                    ))}
                    {!data.education?.level && !data.courseCredentials.length && <p className="text-sm text-ink-soft">{isOwner ? "Add your education and certifications." : "Not added yet."}</p>}
                  </div>
                )}
              </Card>
            </div>

            {/* Highlights */}
            <Card title="Highlights from Families" tone="pink">
              {data.reviews.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {data.reviews.map((r) => (
                    <div key={r.id} className="rounded-xl bg-white/70 p-4">
                      <div className="mb-1 flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3.5 w-3.5 ${i < (r.rating ?? 0) ? "fill-[#e0a72e] text-[#e0a72e]" : "text-ink/15"}`} />)}</div>
                      <p className="text-sm text-ink">&ldquo;{r.body}&rdquo;</p>
                      <p className="mt-2 text-xs text-ink-soft">— {r.reviewer_name ?? "A family"}{r.relationship ? `, ${r.relationship}` : ""}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-ink-soft">No reviews yet. {isOwner ? "Invite a past family or employer to leave a short review." : ""}</p>}
              {isOwner && (
                <Link href="/profile/reviews" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-ink transition hover:bg-white">
                  <Star className="h-3.5 w-3.5 text-[#e0a72e]" /> Invite &amp; manage reviews
                </Link>
              )}
            </Card>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="flex flex-col gap-5">
            {/* Verification — owner only */}
            {isOwner && (
              <VerificationStatusCard
                verifications={data.verifications}
                hasAuthenticateUser={data.hasAuthenticateUser}
                hasDob={data.hasDob}
              />
            )}

            {/* Snapshot */}
            <Card title="Snapshot" tone="peach" owner={isOwner} open={open === "avail"} onEdit={toggle("avail")}>
              {open === "avail" ? (
                <div className="flex flex-col gap-2">
                  <SubHead>Availability windows</SubHead>
                  <CheckList options={Object.entries(AVAILABILITY_WINDOWS)} value={avail.windows} onChange={(v) => setAvail({ ...avail, windows: v })} />
                  <SubHead>Availability type</SubHead>
                  <CheckList options={Object.entries(AVAILABILITY_TYPES)} value={avail.types} onChange={(v) => setAvail({ ...avail, types: v })} />
                  <SubHead>Openness</SubHead>
                  <CheckList options={Object.entries(AVAILABILITY_OPENNESS)} value={avail.openness} onChange={(v) => setAvail({ ...avail, openness: v })} />
                  <SaveRow pending={pending} onCancel={close} onSave={() => run(() => updateAvailability(avail))} />
                </div>
              ) : snapshot.length ? (
                <div className="flex flex-col gap-2.5">{snapshot.map((s, i) => <div key={i} className="flex items-center gap-2 text-sm text-ink"><span className={`h-2.5 w-2.5 rounded-full ${s.tone}`} /> {s.label}</div>)}</div>
              ) : <p className="text-sm text-ink-soft">Add ages, languages & availability.</p>}
            </Card>

            {/* Skills */}
            <Card title="Skills" tone="blue" owner={isOwner} open={open === "skills"} onEdit={toggle("skills")}>
              {open === "skills" ? (
                <div className="flex flex-col gap-2">
                  <CheckList options={Object.entries(CARE_SETTINGS)} value={settings} onChange={setSettings} />
                  <SaveRow pending={pending} onCancel={close} onSave={() => run(() => updateSettings(settings))} />
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">{data.settings.length ? data.settings.map((s) => <Chip key={s} tone="blue">{CARE_SETTINGS[s]}</Chip>) : <span className="text-sm text-ink-soft">—</span>}</div>
              )}
            </Card>

            {/* TRC Certified Pro */}
            {hasCoursePro && (
              <Card tone="green">
                <div className="flex flex-col items-center gap-2 py-2 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-[#cfe0b0]"><ShieldCheck className="h-6 w-6 text-[#4f6b15]" /></span>
                  <p className="font-display font-bold text-ink">TRC Certified Pro</p>
                  <p className="text-xs text-ink-soft">Completed advanced Raising Club training.</p>
                  <Link href="/dashboard/courses" className="text-xs font-semibold text-[#4f6b15] hover:underline">View Badge Details</Link>
                </div>
              </Card>
            )}

            {/* Languages */}
            <Card title="Languages" tone="white" owner={isOwner} open={open === "lang"} onEdit={toggle("lang")}>
              {open === "lang" ? (
                <div className="flex flex-col gap-2">
                  <input className={inputCls} value={langs} onChange={(e) => setLangs(e.target.value)} placeholder="English, Spanish…" />
                  <p className="text-xs text-ink-soft">Comma separated. The first is primary.</p>
                  <SaveRow pending={pending} onCancel={close} onSave={() => run(() => updateLanguages(langs.split(",").map((s) => s.trim()).filter(Boolean)))} />
                </div>
              ) : data.languages.length ? (
                <ul className="flex flex-col gap-2">
                  {data.languages.map((l) => (
                    <li key={l.language} className="flex items-center justify-between text-sm"><span className="text-ink">{l.language}</span><span className="text-xs text-ink-soft">{l.is_primary ? "Primary" : "Fluent"}</span></li>
                  ))}
                </ul>
              ) : <span className="text-sm text-ink-soft">—</span>}
            </Card>
          </div>
        </div>
      </main>

      <div className={`fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-white shadow-xl transition-all ${toast ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"}`}>{toast}</div>
    </div>
  );
}
