import type { Metadata } from "next";
import { Search } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CoursesFilters } from "@/components/courses/courses-filters";
import { CatalogCard } from "@/components/courses/course-card";
import { listCatalog, getPublicTaxonomy, parseCourseFilters } from "@/lib/courses/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Browse Courses — The Raising Club",
  description: "Discover and enroll in professional childcare courses.",
};

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("coursesPage");
  const sp = await searchParams;
  const filters = parseCourseFilters(sp);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user && !user.is_anonymous;
  const [items, taxonomy] = await Promise.all([listCatalog(filters), getPublicTaxonomy()]);

  const hidden: { name: string; value: string }[] = [];
  for (const k of ["category", "approach", "care", "skills", "ageMax", "type"]) {
    const v = sp[k];
    const val = Array.isArray(v) ? v[0] : v;
    if (val) hidden.push({ name: k, value: val });
  }

  return (
    <>
      {!isLoggedIn && <SiteHeader />}
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
          <header className="mb-8">
            <h1 className="font-display text-3xl font-bold text-ink lg:text-4xl">{t("title")}</h1>
            <p className="mt-2 text-ink-soft">{t("description")}</p>

            <form action="/courses" method="get" className="mt-6 max-w-md">
              {hidden.map((h) => (
                <input key={h.name} type="hidden" name={h.name} value={h.value} />
              ))}
              <div className="relative">
                <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft/60" />
                <input
                  type="search"
                  name="q"
                  defaultValue={filters.q ?? ""}
                  placeholder={t("searchPlaceholder")}
                  className="w-full rounded-full border border-ink/15 bg-white py-3 pl-11 pr-4 text-sm text-ink shadow-sm outline-none focus:border-primary"
                />
              </div>
            </form>
          </header>

          <div className="lg:flex lg:gap-8">
            <div className="mb-6 lg:mb-0 lg:w-64 lg:shrink-0">
              <CoursesFilters taxonomy={taxonomy} />
            </div>

            <div className="flex-1">
              {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-ink/15 bg-white/50 p-12 text-center">
                  <p className="font-display text-lg font-bold text-ink">{t("noResults")}</p>
                  <p className="mt-1 text-sm text-ink-soft">{t("noResultsHint")}</p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((it) => (
                    <CatalogCard key={`${it.kind}-${it.id}`} item={it} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
