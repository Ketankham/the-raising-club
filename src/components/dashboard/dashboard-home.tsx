import Link from "next/link";
import { ArrowRight, Check, BookOpen, MapPin, UserRound } from "lucide-react";
import type { Role } from "./dashboard-shell";
import { DashboardTour } from "./dashboard-tour";
import type { MyCourseRow } from "@/lib/courses/learner-queries";
import type { EventListItem } from "@/lib/events/types";
import { locationLabel, shortDateLabel } from "@/lib/events/format";

function ThemeCard({
  tone, title, subtitle, children, cta, ctaHref, link, linkHref, tourId,
}: {
  tone: "peach" | "sage" | "lavender";
  title: string;
  subtitle: string;
  children: React.ReactNode;
  cta: string;
  ctaHref: string;
  link: string;
  linkHref: string;
  tourId?: string;
}) {
  const bg = { peach: "bg-[#fbeadd]", sage: "bg-[#e6ecd6]", lavender: "bg-[#ece9f5]" }[tone];
  return (
    <div data-tour={tourId} className={`flex flex-col rounded-2xl ${bg} p-5`}>
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
      <div className="my-4 flex-1 rounded-xl bg-white/80 p-4">{children}</div>
      <Link href={ctaHref} className="rounded-full bg-white py-2.5 text-center text-sm font-semibold text-ink shadow-sm transition hover:shadow">{cta}</Link>
      <Link href={linkHref} className="mt-2 text-center text-xs font-medium text-ink-soft hover:text-ink">{link}</Link>
    </div>
  );
}

function CourseProgress({ course }: { course: MyCourseRow }) {
  const pct = course.totalModules > 0
    ? Math.round((course.completedModules / course.totalModules) * 100)
    : 0;
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sage">
        <BookOpen className="h-5 w-5 text-ink" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{course.title}</p>
        <p className="text-xs text-ink-soft">
          {course.completedModules}/{course.totalModules} modules · {pct}% complete
        </p>
        <div className="mt-2 h-1.5 w-full rounded-full bg-ink/10">
          <div className="h-full rounded-full bg-olive transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

export function DashboardHome({
  name,
  showTour,
  inProgressCourse,
  nextEvent,
  courseCount,
}: {
  role: Role;
  userId: string;
  name: string;
  showTour?: boolean;
  inProgressCourse?: MyCourseRow | null;
  nextEvent?: EventListItem | null;
  courseCount?: number;
}) {
  const hasCourse = !!inProgressCourse;
  const courseHref = inProgressCourse ? `/courses/${inProgressCourse.slug}` : "/courses";
  const pct = inProgressCourse && inProgressCourse.totalModules > 0
    ? Math.round((inProgressCourse.completedModules / inProgressCourse.totalModules) * 100)
    : 0;

  return (
    <div className="relative">
      <svg className="pointer-events-none absolute -right-10 top-24 -z-0 h-64 w-64 text-purple/20" viewBox="0 0 200 200" fill="none"><path d="M40 100c0-60 120-80 120-20s-100 80-100 40 80-60 40-80" stroke="currentColor" strokeWidth="3" /></svg>
      <svg className="pointer-events-none absolute bottom-0 left-1/3 -z-0 h-40 w-72 text-primary/20" viewBox="0 0 300 120" fill="none"><path d="M10 60C60 10 120 110 160 60s100-60 130 0" stroke="currentColor" strokeWidth="3" /></svg>

      <div className="relative z-10">
        <h1 className="font-display text-3xl font-bold text-ink">Welcome back, {name}</h1>

        {/* NEXT BEST STEP */}
        <section className="mt-6 rounded-2xl bg-[#f3ead6] p-6 sm:p-8">
          <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-ink-soft">Your next best step</p>
          {hasCourse ? (
            <>
              <h2 className="mt-2 max-w-2xl font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl">
                Continue: {inProgressCourse!.title}
              </h2>
              <p className="mt-3 max-w-2xl text-ink-soft">
                {pct}% complete · {inProgressCourse!.completedModules} of {inProgressCourse!.totalModules} modules done.
                Pick up where you left off.
              </p>
              <div className="mt-4 h-2 max-w-xs rounded-full bg-ink/10">
                <div className="h-full rounded-full bg-olive" style={{ width: `${pct}%` }} />
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-2 max-w-2xl font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl">
                Start your first course
              </h2>
              <p className="mt-3 max-w-2xl text-ink-soft">
                Browse our course library and enroll in something that fits your goals. Short, practical lessons you can apply today.
              </p>
            </>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={courseHref} className="inline-flex items-center gap-1.5 rounded-full bg-yellow px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-95">
              {hasCourse ? "Continue Lesson" : "Browse Courses"} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/courses" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink shadow-sm">
              {hasCourse ? "Browse all courses" : "See what's available"}
            </Link>
          </div>
        </section>

        {/* THREE CARDS */}
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <ThemeCard tourId="connect" tone="peach" title="Connect" subtitle="Build your club with other parents, caregivers or educators." cta="Find Caregivers" ctaHref="/connect" link="Connect with families" linkHref="/connect/families">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pink">
                <UserRound className="h-5 w-5 text-primary" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">Your Raising Club</p>
                <p className="text-xs text-ink-soft">Find trusted caregivers and meet nearby families</p>
              </div>
            </div>
          </ThemeCard>

          <ThemeCard
            tourId="learn"
            tone="sage"
            title="Learn"
            subtitle="Short lessons you can use today."
            cta={hasCourse ? "Continue Lesson" : "Start a Course"}
            ctaHref={courseHref}
            link="Browse courses"
            linkHref="/courses"
          >
            {hasCourse ? (
              <CourseProgress course={inProgressCourse!} />
            ) : (
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sage">
                  <BookOpen className="h-5 w-5 text-ink" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {courseCount ? `${courseCount} course${courseCount > 1 ? "s" : ""} enrolled` : "No courses yet"}
                  </p>
                  <p className="text-xs text-ink-soft">Browse and enrol in a course to get started</p>
                </div>
              </div>
            )}
          </ThemeCard>

          <ThemeCard tourId="events" tone="lavender" title="Events" subtitle="Meet people who care like you." cta={nextEvent ? "View Event" : "Browse Events"} ctaHref={nextEvent ? `/events/${nextEvent.slug}` : "/events"} link="See calendar" linkHref="/events">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lavender">
                <MapPin className="h-5 w-5 text-purple" />
              </span>
              {nextEvent ? (
                <div>
                  <p className="truncate text-sm font-semibold text-ink">{nextEvent.title}</p>
                  <p className="text-xs text-ink-soft">
                    {nextEvent.nextSession ? shortDateLabel(nextEvent.nextSession.startsAt) : "Upcoming"}
                    {nextEvent.location ? ` · ${locationLabel(nextEvent.location)}` : ""}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-ink">No upcoming events</p>
                  <p className="text-xs text-ink-soft">Browse events to find gatherings near you</p>
                </div>
              )}
            </div>
          </ThemeCard>
        </div>

        {/* YOUR JOURNEY */}
        <section className="mt-6 rounded-2xl bg-[#f3ead6] p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Your journey</h2>
          <p className="mt-1 text-sm text-ink-soft">Three simple steps to make the most of your club.</p>
          <ol className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
            {[
              { label: "Set your preferences", done: true },
              { label: "Take one foundation lesson", done: !!inProgressCourse?.completedModules },
              { label: "Attend your first gathering", done: false },
            ].map((s, i, arr) => (
              <li key={s.label} className="flex flex-1 items-center gap-3">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${s.done ? "bg-olive text-white" : "border-2 border-ink/20 text-transparent"}`}>
                  <Check className="h-4 w-4" />
                </span>
                <span className={`text-sm ${s.done ? "text-ink" : "text-ink-soft"}`}>{s.label}</span>
                {i < arr.length - 1 && <span className="hidden h-px flex-1 bg-ink/15 sm:block" />}
              </li>
            ))}
          </ol>
          <Link href="/courses" className="mt-5 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink shadow-sm">
            View all courses
          </Link>
        </section>
      </div>

      {showTour && <DashboardTour />}
    </div>
  );
}
