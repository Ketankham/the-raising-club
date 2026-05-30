import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Award, ImageIcon } from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { createClient } from "@/lib/supabase/server";
import { getMyCourses, type MyCourseRow } from "@/lib/courses/learner-queries";
import { shortDate } from "@/lib/courses/format";

export const metadata = { title: "My Courses — The Raising Club" };

export default async function MyCoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent("/courses/my")}`);

  const { data: profile } = await supabase.from("profiles").select("preferred_name, first_name").eq("id", user.id).maybeSingle();
  const name = profile?.preferred_name || profile?.first_name || "there";

  const rows = await getMyCourses();
  const inProgress = rows.filter((r) => r.status === "active");
  const completed = rows.filter((r) => r.status === "completed");

  return (
    <>
      <AppHeader
        name={name}
        nav={[
          { href: "/dashboard", label: "Dashboard home" },
          { href: "/courses", label: "Browse courses" },
          { href: "/courses/my", label: "My courses" },
          { href: "/events", label: "Events" },
        ]}
      />
      <main className="min-h-screen bg-cream/30">
        <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
          <h1 className="font-display text-3xl font-bold text-ink">Good to see you, {name}</h1>
          <p className="mt-1 text-ink-soft">Your learning space — pick up wherever you left off.</p>

          {rows.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-ink/15 bg-white/60 p-12 text-center">
              <p className="font-display text-lg font-bold text-ink">No courses yet</p>
              <p className="mt-1 text-sm text-ink-soft">Find something that fits your real caregiving life.</p>
              <Link href="/courses" className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
                Browse courses <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="mt-8 space-y-10">
              {inProgress.length > 0 && (
                <Section title="In progress" subtitle="You're doing great — keep going.">
                  {inProgress.map((c) => <InProgressCard key={c.slug} c={c} />)}
                </Section>
              )}
              {completed.length > 0 && (
                <Section title="Completed" subtitle="Celebrate your accomplishments.">
                  {completed.map((c) => <CompletedCard key={c.slug} c={c} />)}
                </Section>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
      <p className="text-sm text-ink-soft">{subtitle}</p>
      <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

function Cover({ url, title }: { url: string | null; title: string }) {
  return (
    <div className="aspect-[16/9] overflow-hidden bg-lavender">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={title} className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full place-items-center text-ink-soft/30"><ImageIcon size={36} /></div>
      )}
    </div>
  );
}

function InProgressCard({ c }: { c: MyCourseRow }) {
  const pct = c.totalModules ? Math.round((c.completedModules / c.totalModules) * 100) : 0;
  return (
    <article className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
      <Cover url={c.coverImageUrl} title={c.title} />
      <div className="p-4">
        <h3 className="line-clamp-2 font-display font-bold text-ink">{c.title}</h3>
        <p className="mt-1 text-xs text-ink-soft">Started on {shortDate(c.startedAt)}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-cream">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <Link href={`/courses/${c.slug}`} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
          Continue <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  );
}

function CompletedCard({ c }: { c: MyCourseRow }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
      <Cover url={c.coverImageUrl} title={c.title} />
      <div className="p-4">
        <h3 className="line-clamp-2 font-display font-bold text-ink">{c.title}</h3>
        <p className="mt-1 text-xs text-ink-soft">Completed {shortDate(c.completedAt)}</p>
        {c.hasCertificate ? (
          <Link href={`/courses/${c.slug}/certificate`} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-olive/20 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-olive/30">
            <Award size={15} /> See your certificate 🎉
          </Link>
        ) : (
          <Link href={`/courses/${c.slug}`} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink-soft hover:text-ink">
            Review course
          </Link>
        )}
      </div>
    </article>
  );
}
