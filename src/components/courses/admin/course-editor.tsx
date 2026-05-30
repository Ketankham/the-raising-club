"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Save,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Sparkles,
  Award,
  FileText,
  Check,
} from "lucide-react";
import { RichTextEditor } from "./rich-text-editor";
import { saveCourseStructure } from "@/lib/courses/admin-actions";
import {
  CARE_TYPE_LABELS,
  RESOURCE_KIND_LABELS,
  type CourseEditorInput,
  type CourseTaxonomy,
  type ChapterInput,
  type ModuleInput,
  type ResourceInput,
  type RevisionQuestionInput,
  type QuizQuestionInput,
  type CourseResourceKind,
  type CourseCareType,
  type CourseVideoProvider,
} from "@/lib/courses/types";

const uid = () => crypto.randomUUID();

// --- form primitives --------------------------------------------------------
const inputCls =
  "w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-primary focus:outline-none";

function Labeled({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-semibold text-ink">{label}</span>}
      {hint && <span className="mb-1.5 block text-xs text-ink-soft">{hint}</span>}
      {children}
    </label>
  );
}

function Panel({ title, desc, action, children }: { title: string; desc?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
          {desc && <p className="mt-0.5 text-sm text-ink-soft">{desc}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function IconBtn({ onClick, label, danger, children }: { onClick: () => void; label: string; danger?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      aria-label={label}
      className={`grid h-7 w-7 place-items-center rounded-md text-ink-soft transition hover:bg-cream ${danger ? "hover:text-red-600" : "hover:text-ink"}`}
    >
      {children}
    </button>
  );
}

function move<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const next = [...arr];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

type TabId = "details" | "curriculum" | "quiz" | "certificate";
const TABS: { id: TabId; label: string; icon: typeof BookOpen }[] = [
  { id: "details", label: "Course details", icon: FileText },
  { id: "curriculum", label: "Chapters & modules", icon: BookOpen },
  { id: "quiz", label: "Quiz", icon: Sparkles },
  { id: "certificate", label: "Certificate", icon: Award },
];

// ---------------------------------------------------------------------------
export function CourseEditor({ initial, taxonomy }: { initial: CourseEditorInput; taxonomy: CourseTaxonomy }) {
  const router = useRouter();
  const [course, setCourse] = useState<CourseEditorInput>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [tab, setTab] = useState<TabId>("details");
  const [openChapter, setOpenChapter] = useState<string | null>(null);
  const [openModule, setOpenModule] = useState<string | null>(null);

  const patch = (p: Partial<CourseEditorInput>) => setCourse((c) => ({ ...c, ...p }));

  // chapter / module helpers ------------------------------------------------
  const setChapters = (chapters: ChapterInput[]) => patch({ chapters });
  const updateChapter = (ci: number, p: Partial<ChapterInput>) =>
    setChapters(course.chapters.map((c, i) => (i === ci ? { ...c, ...p } : c)));
  const updateModule = (ci: number, mi: number, p: Partial<ModuleInput>) =>
    updateChapter(ci, { modules: course.chapters[ci].modules.map((m, i) => (i === mi ? { ...m, ...p } : m)) });

  const addChapter = () => {
    const id = uid();
    setChapters([...course.chapters, { id, title: "", summary: "", position: course.chapters.length, modules: [] }]);
    setOpenChapter(id);
    setOpenModule(null);
  };
  const addModule = (ci: number) => {
    const id = uid();
    updateChapter(ci, {
      modules: [
        ...course.chapters[ci].modules,
        { id, title: "", body: "", videoProvider: null, videoUrl: "", estMinutes: null, position: course.chapters[ci].modules.length, resources: [], revisionQuestion: null },
      ],
    });
    setOpenModule(id);
  };

  const save = (after?: () => void) =>
    start(async () => {
      setMsg(null);
      const res = await saveCourseStructure(course);
      if (res.ok) {
        setMsg({ kind: "ok", text: "Saved." });
        router.refresh();
        after?.();
      } else {
        setMsg({ kind: "err", text: res.message ?? `Could not save (${res.reason}).` });
      }
    });

  const tabIndex = TABS.findIndex((t) => t.id === tab);
  const nextTab = TABS[tabIndex + 1];
  const prevTab = TABS[tabIndex - 1];

  const totalModules = course.chapters.reduce((n, ch) => n + ch.modules.length, 0);

  return (
    <div className="pb-28">
      {/* STEP TABS ---------------------------------------------------------- */}
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TABS.map((t, i) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                active ? "border-primary bg-primary/10 font-semibold text-ink" : "border-ink/10 bg-white text-ink-soft hover:border-ink/25"
              }`}
            >
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${active ? "bg-primary text-white" : "bg-cream text-ink-soft"}`}>
                {i + 1}
              </span>
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* DETAILS TAB -------------------------------------------------------- */}
      {tab === "details" && (
        <div className="space-y-6">
          <Panel title="Course details" desc="The essentials shown on the listing and detail page.">
            <div className="grid gap-4">
              <Labeled label="Title">
                <input className={inputCls} value={course.title} onChange={(e) => patch({ title: e.target.value })} />
              </Labeled>
              <Labeled label="Subtitle" hint="A short tagline under the title.">
                <input className={inputCls} value={course.subtitle} onChange={(e) => patch({ subtitle: e.target.value })} />
              </Labeled>
              <Labeled label="Summary" hint="The blurb on the course card.">
                <textarea className={inputCls} rows={2} value={course.summary} onChange={(e) => patch({ summary: e.target.value })} />
              </Labeled>
              <Labeled label="Description" hint="The longer description on the detail page.">
                <textarea className={inputCls} rows={4} value={course.description} onChange={(e) => patch({ description: e.target.value })} />
              </Labeled>
              <div className="grid gap-4 sm:grid-cols-2">
                <Labeled label="Cover image URL">
                  <input className={inputCls} value={course.coverImageUrl} onChange={(e) => patch({ coverImageUrl: e.target.value })} placeholder="https://…" />
                </Labeled>
                <div className="grid grid-cols-[110px_1fr] gap-2">
                  <Labeled label="Intro video">
                    <select className={inputCls} value={course.introVideoProvider ?? ""} onChange={(e) => patch({ introVideoProvider: (e.target.value || null) as CourseVideoProvider | null })}>
                      <option value="">None</option>
                      <option value="youtube">YouTube</option>
                      <option value="vimeo">Vimeo</option>
                    </select>
                  </Labeled>
                  <Labeled label="Video URL">
                    <input className={inputCls} value={course.introVideoUrl} onChange={(e) => patch({ introVideoUrl: e.target.value })} placeholder="https://…" />
                  </Labeled>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Labeled label="Category">
                  <select className={inputCls} value={course.categoryId ?? ""} onChange={(e) => patch({ categoryId: e.target.value || null })}>
                    <option value="">—</option>
                    {taxonomy.categories.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </Labeled>
                <Labeled label="Approach">
                  <select className={inputCls} value={course.approachId ?? ""} onChange={(e) => patch({ approachId: e.target.value || null })}>
                    <option value="">—</option>
                    {taxonomy.approaches.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </Labeled>
                <Labeled label="Care type">
                  <select className={inputCls} value={course.careType ?? ""} onChange={(e) => patch({ careType: (e.target.value || null) as CourseCareType | null })}>
                    <option value="">—</option>
                    {(Object.keys(CARE_TYPE_LABELS) as CourseCareType[]).map((k) => <option key={k} value={k}>{CARE_TYPE_LABELS[k]}</option>)}
                  </select>
                </Labeled>
              </div>
              <div className="grid gap-4 sm:grid-cols-4">
                <Labeled label="Age min (months)">
                  <input type="number" min={0} className={inputCls} value={course.ageMinMonths ?? ""} onChange={(e) => patch({ ageMinMonths: e.target.value ? Number(e.target.value) : null })} />
                </Labeled>
                <Labeled label="Age max (months)">
                  <input type="number" min={0} className={inputCls} value={course.ageMaxMonths ?? ""} onChange={(e) => patch({ ageMaxMonths: e.target.value ? Number(e.target.value) : null })} />
                </Labeled>
                <Labeled label="Est. learning (min)">
                  <input type="number" min={0} className={inputCls} value={course.estimatedLearningMinutes ?? ""} onChange={(e) => patch({ estimatedLearningMinutes: e.target.value ? Number(e.target.value) : null })} />
                </Labeled>
                <Labeled label="Mode">
                  <input className={inputCls} value={course.mode} onChange={(e) => patch({ mode: e.target.value })} />
                </Labeled>
              </div>
              <div className="flex flex-wrap items-center gap-5 pt-1">
                <label className="flex items-center gap-2 text-sm font-medium text-ink">
                  <input type="checkbox" checked={course.isFree} onChange={(e) => patch({ isFree: e.target.checked })} /> Free course
                </label>
                {!course.isFree && (
                  <>
                    <Labeled label="Price (cents)">
                      <input type="number" min={0} className={inputCls} value={course.priceCents} onChange={(e) => patch({ priceCents: Number(e.target.value) })} />
                    </Labeled>
                    <Labeled label="Compare-at (cents)">
                      <input type="number" min={0} className={inputCls} value={course.compareAtPriceCents ?? ""} onChange={(e) => patch({ compareAtPriceCents: e.target.value ? Number(e.target.value) : null })} />
                    </Labeled>
                  </>
                )}
                <label className="flex items-center gap-2 text-sm font-medium text-ink">
                  <input type="checkbox" checked={course.isFeatured} onChange={(e) => patch({ isFeatured: e.target.checked })} /> Featured
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-ink">
                  <input type="checkbox" checked={course.skipToCertEnabled} onChange={(e) => patch({ skipToCertEnabled: e.target.checked })} /> Allow “skip to certification”
                </label>
              </div>
            </div>
          </Panel>

          <Panel title="Skills" desc="Caregivers who complete this course earn these skills (searchable in the marketplace).">
            <div className="flex flex-wrap gap-2">
              {taxonomy.skills.map((s) => {
                const on = course.skillIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => patch({ skillIds: on ? course.skillIds.filter((x) => x !== s.id) : [...course.skillIds, s.id] })}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${on ? "border-primary bg-primary/10 font-semibold text-primary" : "border-ink/15 text-ink-soft hover:border-ink/30"}`}
                  >
                    {on && <Check size={13} className="mr-1 inline" />}{s.label}
                  </button>
                );
              })}
              {taxonomy.skills.length === 0 && <p className="text-sm text-ink-soft">No skills seeded yet.</p>}
            </div>
          </Panel>
        </div>
      )}

      {/* CURRICULUM TAB ----------------------------------------------------- */}
      {tab === "curriculum" && (
        <Panel
          title="Chapters & modules"
          desc={`${course.chapters.length} chapter${course.chapters.length === 1 ? "" : "s"} · ${totalModules} module${totalModules === 1 ? "" : "s"}. Click a chapter to open it.`}
          action={
            <button type="button" onClick={addChapter} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
              <Plus size={15} /> Add chapter
            </button>
          }
        >
          <div className="space-y-2.5">
            {course.chapters.map((ch, ci) => {
              const isOpen = openChapter === ch.id;
              return (
                <div key={ch.id} className="overflow-hidden rounded-xl border border-ink/10">
                  {/* chapter header row */}
                  <div
                    onClick={() => { setOpenChapter(isOpen ? null : ch.id); setOpenModule(null); }}
                    className={`flex cursor-pointer items-center gap-2 px-3 py-2.5 ${isOpen ? "bg-cream/60" : "bg-white hover:bg-cream/30"}`}
                  >
                    <ChevronRight size={16} className={`shrink-0 text-ink-soft transition ${isOpen ? "rotate-90" : ""}`} />
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-lavender text-xs font-bold text-ink">{ci + 1}</span>
                    <span className="min-w-0 flex-1 truncate font-semibold text-ink">{ch.title || <span className="text-ink-soft/60">Untitled chapter</span>}</span>
                    <span className="shrink-0 text-xs text-ink-soft">{ch.modules.length} module{ch.modules.length === 1 ? "" : "s"}</span>
                    <IconBtn onClick={() => setChapters(move(course.chapters, ci, -1))} label="Move up"><ChevronUp size={16} /></IconBtn>
                    <IconBtn onClick={() => setChapters(move(course.chapters, ci, 1))} label="Move down"><ChevronDown size={16} /></IconBtn>
                    <IconBtn onClick={() => { setChapters(course.chapters.filter((_, i) => i !== ci)); if (isOpen) setOpenChapter(null); }} label="Delete chapter" danger><Trash2 size={16} /></IconBtn>
                  </div>

                  {/* expanded chapter body */}
                  {isOpen && (
                    <div className="border-t border-ink/10 bg-white p-4">
                      <div className="mb-4 grid gap-3 sm:grid-cols-2">
                        <Labeled label="Chapter title">
                          <input className={inputCls} placeholder={`Chapter ${ci + 1} title`} value={ch.title} onChange={(e) => updateChapter(ci, { title: e.target.value })} />
                        </Labeled>
                        <Labeled label="Summary (optional)">
                          <input className={inputCls} value={ch.summary} onChange={(e) => updateChapter(ci, { summary: e.target.value })} />
                        </Labeled>
                      </div>

                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Modules</p>
                      <div className="space-y-2">
                        {ch.modules.map((m, mi) => {
                          const mOpen = openModule === m.id;
                          return (
                            <div key={m.id} className="overflow-hidden rounded-lg border border-ink/10">
                              <div
                                onClick={() => setOpenModule(mOpen ? null : m.id)}
                                className={`flex cursor-pointer items-center gap-2 px-3 py-2 ${mOpen ? "bg-cream/60" : "bg-white hover:bg-cream/30"}`}
                              >
                                <ChevronRight size={15} className={`shrink-0 text-ink-soft transition ${mOpen ? "rotate-90" : ""}`} />
                                <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-sage text-[11px] font-bold text-ink">{mi + 1}</span>
                                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{m.title || <span className="text-ink-soft/60">Untitled module</span>}</span>
                                <ModuleTags m={m} />
                                <IconBtn onClick={() => updateChapter(ci, { modules: move(ch.modules, mi, -1) })} label="Move up"><ChevronUp size={15} /></IconBtn>
                                <IconBtn onClick={() => updateChapter(ci, { modules: move(ch.modules, mi, 1) })} label="Move down"><ChevronDown size={15} /></IconBtn>
                                <IconBtn onClick={() => { updateChapter(ci, { modules: ch.modules.filter((_, i) => i !== mi) }); if (mOpen) setOpenModule(null); }} label="Delete module" danger><Trash2 size={15} /></IconBtn>
                              </div>
                              {mOpen && (
                                <div className="border-t border-ink/10 bg-white p-3">
                                  <ModuleEditor module={m} onChange={(p) => updateModule(ci, mi, p)} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {ch.modules.length === 0 && <p className="px-1 py-2 text-sm text-ink-soft">No modules yet.</p>}
                      </div>

                      <button type="button" onClick={() => addModule(ci)} className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-dashed border-ink/25 px-3 py-1.5 text-sm font-medium text-ink-soft hover:border-primary hover:text-primary">
                        <Plus size={14} /> Add module
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {course.chapters.length === 0 && (
              <p className="rounded-xl border border-dashed border-ink/15 p-6 text-center text-sm text-ink-soft">
                No chapters yet. Add your first chapter to start building the course.
              </p>
            )}
          </div>
        </Panel>
      )}

      {/* QUIZ TAB ----------------------------------------------------------- */}
      {tab === "quiz" && <QuizBuilder quiz={course.quiz} onChange={(quiz) => patch({ quiz })} />}

      {/* CERTIFICATE TAB ---------------------------------------------------- */}
      {tab === "certificate" && (
        <Panel title="Certificate" desc="Signers and footer shown on the completion certificate.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Labeled label="Signer 1 — name">
              <input className={inputCls} value={course.certificate.signer1Name} onChange={(e) => patch({ certificate: { ...course.certificate, signer1Name: e.target.value } })} />
            </Labeled>
            <Labeled label="Signer 1 — title">
              <input className={inputCls} value={course.certificate.signer1Title} onChange={(e) => patch({ certificate: { ...course.certificate, signer1Title: e.target.value } })} />
            </Labeled>
            <Labeled label="Signer 2 — name">
              <input className={inputCls} value={course.certificate.signer2Name} onChange={(e) => patch({ certificate: { ...course.certificate, signer2Name: e.target.value } })} />
            </Labeled>
            <Labeled label="Signer 2 — title">
              <input className={inputCls} value={course.certificate.signer2Title} onChange={(e) => patch({ certificate: { ...course.certificate, signer2Title: e.target.value } })} />
            </Labeled>
            <div className="sm:col-span-2">
              <Labeled label="Footer disclaimer">
                <textarea className={inputCls} rows={2} value={course.certificate.footerDisclaimer} onChange={(e) => patch({ certificate: { ...course.certificate, footerDisclaimer: e.target.value } })} />
              </Labeled>
            </div>
          </div>
        </Panel>
      )}

      {/* SAVE BAR ----------------------------------------------------------- */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-white/95 backdrop-blur lg:pl-60">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <select className={`${inputCls} w-auto`} value={course.status} onChange={(e) => patch({ status: e.target.value as CourseEditorInput["status"] })}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            {msg && <span className={`hidden text-sm font-medium sm:inline ${msg.kind === "ok" ? "text-[#7ba84f]" : "text-red-600"}`}>{msg.text}</span>}
          </div>
          <div className="flex items-center gap-2">
            {prevTab && (
              <button type="button" onClick={() => setTab(prevTab.id)} className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink-soft hover:text-ink">
                <ArrowLeft size={15} /> Back
              </button>
            )}
            {nextTab && (
              <button type="button" onClick={() => setTab(nextTab.id)} className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-cream">
                Next <ArrowRight size={15} />
              </button>
            )}
            <button type="button" onClick={() => save()} disabled={pending} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60">
              <Save size={16} /> {pending ? "Saving…" : "Save course"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- compact module indicator tags -----------------------------------------
function ModuleTags({ m }: { m: ModuleInput }) {
  const tags: string[] = [];
  if (m.body && m.body.replace(/<[^>]*>/g, "").trim()) tags.push("Text");
  if (m.videoUrl) tags.push("Video");
  if (m.resources.length) tags.push(`${m.resources.length} resource${m.resources.length === 1 ? "" : "s"}`);
  if (m.revisionQuestion) tags.push("Pause & Notice");
  if (!tags.length) return null;
  return (
    <span className="hidden shrink-0 gap-1 sm:flex">
      {tags.map((t) => (
        <span key={t} className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-medium text-ink-soft">{t}</span>
      ))}
    </span>
  );
}

// --- Module editor (expanded body) -----------------------------------------
function ModuleEditor({ module: m, onChange }: { module: ModuleInput; onChange: (p: Partial<ModuleInput>) => void }) {
  const addResource = () =>
    onChange({ resources: [...m.resources, { id: uid(), label: "", kind: "link", url: "", filePath: null, position: m.resources.length }] });
  const updateResource = (ri: number, p: Partial<ResourceInput>) =>
    onChange({ resources: m.resources.map((r, i) => (i === ri ? { ...r, ...p } : r)) });
  const toggleRevision = () =>
    onChange({
      revisionQuestion: m.revisionQuestion ? null : { id: uid(), prompt: "", options: [{ id: uid(), body: "", explanation: "", isRecommended: false, position: 0 }] },
    });

  return (
    <div className="grid gap-3">
      <Labeled label="Module title">
        <input className={inputCls} placeholder="Module title" value={m.title} onChange={(e) => onChange({ title: e.target.value })} />
      </Labeled>

      <Labeled label="Text" hint="Optional. Leave empty for a video-only or resources-only module.">
        <RichTextEditor value={m.body} onChange={(html) => onChange({ body: html })} />
      </Labeled>

      <div className="grid gap-3 sm:grid-cols-[120px_1fr_120px]">
        <Labeled label="Video">
          <select className={inputCls} value={m.videoProvider ?? ""} onChange={(e) => onChange({ videoProvider: (e.target.value || null) as CourseVideoProvider | null })}>
            <option value="">None</option>
            <option value="youtube">YouTube</option>
            <option value="vimeo">Vimeo</option>
          </select>
        </Labeled>
        <Labeled label="Video URL">
          <input className={inputCls} value={m.videoUrl} onChange={(e) => onChange({ videoUrl: e.target.value })} placeholder="https://…" />
        </Labeled>
        <Labeled label="Minutes">
          <input type="number" min={0} className={inputCls} value={m.estMinutes ?? ""} onChange={(e) => onChange({ estMinutes: e.target.value ? Number(e.target.value) : null })} />
        </Labeled>
      </div>

      {/* Resources */}
      <div className="rounded-lg border border-ink/10 bg-cream/30 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-ink">Resources</span>
          <button type="button" onClick={addResource} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            <Plus size={14} /> Add
          </button>
        </div>
        {m.resources.length === 0 && <p className="text-xs text-ink-soft">No resources.</p>}
        <div className="space-y-2">
          {m.resources.map((r, ri) => (
            <div key={r.id} className="grid grid-cols-[1fr_110px_1fr_28px] items-center gap-2">
              <input className={inputCls} placeholder="Label" value={r.label} onChange={(e) => updateResource(ri, { label: e.target.value })} />
              <select className={inputCls} value={r.kind} onChange={(e) => updateResource(ri, { kind: e.target.value as CourseResourceKind })}>
                {(Object.keys(RESOURCE_KIND_LABELS) as CourseResourceKind[]).map((k) => <option key={k} value={k}>{RESOURCE_KIND_LABELS[k]}</option>)}
              </select>
              <input className={inputCls} placeholder="https://…" value={r.url} onChange={(e) => updateResource(ri, { url: e.target.value })} />
              <IconBtn onClick={() => onChange({ resources: m.resources.filter((_, i) => i !== ri) })} label="Remove resource" danger><Trash2 size={15} /></IconBtn>
            </div>
          ))}
        </div>
      </div>

      {/* Revision question */}
      <div className="rounded-lg border border-ink/10 bg-purple/10 p-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-ink">
          <input type="checkbox" checked={!!m.revisionQuestion} onChange={toggleRevision} />
          “Pause &amp; Notice” question after this module
        </label>
        {m.revisionQuestion && <RevisionEditor question={m.revisionQuestion} onChange={(rq) => onChange({ revisionQuestion: rq })} />}
      </div>
    </div>
  );
}

// --- Revision question editor ----------------------------------------------
function RevisionEditor({ question: q, onChange }: { question: RevisionQuestionInput; onChange: (q: RevisionQuestionInput) => void }) {
  const updateOption = (oi: number, p: Partial<RevisionQuestionInput["options"][number]>) =>
    onChange({ ...q, options: q.options.map((o, i) => (i === oi ? { ...o, ...p } : o)) });

  return (
    <div className="mt-3 space-y-2">
      <input className={inputCls} placeholder="What feels most true for you right now?" value={q.prompt} onChange={(e) => onChange({ ...q, prompt: e.target.value })} />
      {q.options.map((o, oi) => (
        <div key={o.id} className="grid grid-cols-[1fr_1fr_auto_28px] items-center gap-2">
          <input className={inputCls} placeholder={`Option ${oi + 1}`} value={o.body} onChange={(e) => updateOption(oi, { body: e.target.value })} />
          <input className={inputCls} placeholder="Reflection / explanation" value={o.explanation} onChange={(e) => updateOption(oi, { explanation: e.target.value })} />
          <label className="flex items-center gap-1 whitespace-nowrap text-xs text-ink-soft">
            <input type="checkbox" checked={o.isRecommended} onChange={(e) => updateOption(oi, { isRecommended: e.target.checked })} /> highlight
          </label>
          <IconBtn onClick={() => onChange({ ...q, options: q.options.filter((_, i) => i !== oi) })} label="Remove option" danger><Trash2 size={15} /></IconBtn>
        </div>
      ))}
      <button type="button" onClick={() => onChange({ ...q, options: [...q.options, { id: uid(), body: "", explanation: "", isRecommended: false, position: q.options.length }] })} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        <Plus size={14} /> Add option
      </button>
    </div>
  );
}

// --- Quiz builder -----------------------------------------------------------
function QuizBuilder({ quiz, onChange }: { quiz: CourseEditorInput["quiz"]; onChange: (q: CourseEditorInput["quiz"]) => void }) {
  const enable = () => onChange({ introCopy: "", passThreshold: 60, questions: [] });
  const updateQuestion = (qi: number, p: Partial<QuizQuestionInput>) =>
    quiz && onChange({ ...quiz, questions: quiz.questions.map((q, i) => (i === qi ? { ...q, ...p } : q)) });

  return (
    <Panel
      title="Integration Moment (final quiz)"
      desc="Learners must clear this to be certified. Pass mark default 60%, unlimited attempts. Right/wrong is only revealed after passing."
      action={
        quiz ? (
          <button type="button" onClick={() => onChange(null)} className="shrink-0 text-sm font-medium text-ink-soft hover:text-red-600">Remove quiz</button>
        ) : (
          <button type="button" onClick={enable} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
            <Plus size={15} /> Add quiz
          </button>
        )
      }
    >
      {!quiz ? (
        <p className="text-sm text-ink-soft">No quiz yet. Courses without a quiz certify on completing all modules.</p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <Labeled label="Intro copy">
              <input className={inputCls} value={quiz.introCopy} onChange={(e) => onChange({ ...quiz, introCopy: e.target.value })} />
            </Labeled>
            <Labeled label="Pass threshold %">
              <input type="number" min={0} max={100} className={inputCls} value={quiz.passThreshold} onChange={(e) => onChange({ ...quiz, passThreshold: Number(e.target.value) })} />
            </Labeled>
          </div>

          {quiz.questions.map((q, qi) => (
            <div key={q.id} className="rounded-xl border border-ink/10 bg-cream/30 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-md bg-sage text-xs font-bold text-ink">{qi + 1}</span>
                <input className={inputCls} placeholder="Question" value={q.prompt} onChange={(e) => updateQuestion(qi, { prompt: e.target.value })} />
                <IconBtn onClick={() => onChange({ ...quiz, questions: quiz.questions.filter((_, i) => i !== qi) })} label="Delete question" danger><Trash2 size={16} /></IconBtn>
              </div>
              <div className="space-y-2">
                {q.options.map((o, oi) => (
                  <div key={o.id} className="grid grid-cols-[auto_1fr_1fr_28px] items-center gap-2">
                    <label className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-ink-soft">
                      <input type="radio" name={`correct-${q.id}`} checked={o.isCorrect} onChange={() => updateQuestion(qi, { options: q.options.map((x, i) => ({ ...x, isCorrect: i === oi })) })} /> correct
                    </label>
                    <input className={inputCls} placeholder={`Option ${oi + 1}`} value={o.body} onChange={(e) => updateQuestion(qi, { options: q.options.map((x, i) => (i === oi ? { ...x, body: e.target.value } : x)) })} />
                    <input className={inputCls} placeholder="Explanation (shown after passing)" value={o.explanation} onChange={(e) => updateQuestion(qi, { options: q.options.map((x, i) => (i === oi ? { ...x, explanation: e.target.value } : x)) })} />
                    <IconBtn onClick={() => updateQuestion(qi, { options: q.options.filter((_, i) => i !== oi) })} label="Remove option" danger><Trash2 size={15} /></IconBtn>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => updateQuestion(qi, { options: [...q.options, { id: uid(), body: "", explanation: "", isCorrect: false, position: q.options.length }] })} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                <Plus size={14} /> Add option
              </button>
            </div>
          ))}

          <button type="button" onClick={() => onChange({ ...quiz, questions: [...quiz.questions, { id: uid(), prompt: "", options: [{ id: uid(), body: "", explanation: "", isCorrect: true, position: 0 }] }] })} className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-ink/25 px-3 py-1.5 text-sm font-medium text-ink-soft hover:border-primary hover:text-primary">
            <Plus size={14} /> Add question
          </button>
        </div>
      )}
    </Panel>
  );
}
