import { redirect } from "next/navigation";
import { requireUserProfile } from "@/lib/guards";
import { DashboardShell, type Role } from "@/components/dashboard/dashboard-shell";
import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { getMyCourses } from "@/lib/courses/learner-queries";
import { listEvents } from "@/lib/events/queries";

export default async function DashboardPage() {
  const { supabase, user, profile } = await requireUserProfile();
  if (profile.role === "admin") redirect("/admin");

  const role = profile.role as Role;
  const name = profile.preferred_name || profile.first_name || "there";
  const initials = ((profile.preferred_name || profile.first_name || "?")[0] + (profile.last_name?.[0] ?? "")).toUpperCase();

  const [{ count }, myCourses, upcomingEvents] = await Promise.all([
    supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null),
    getMyCourses(),
    listEvents(),
  ]);

  // Pick the most recently active in-progress course, or null if all done / none enrolled
  const inProgressCourse = myCourses.find((c) => c.status === "active" && !c.completedAt) ?? null;
  // Pick the first upcoming event
  const nextEvent = upcomingEvents.find((e) => e.nextSession) ?? upcomingEvents[0] ?? null;

  return (
    <DashboardShell role={role} name={name} email={profile.email} initials={initials} unreadCount={count ?? 0}>
      <DashboardHome
        role={role}
        userId={user.id}
        name={name}
        showTour={!profile.dashboard_tour_completed_at}
        inProgressCourse={inProgressCourse}
        nextEvent={nextEvent}
        courseCount={myCourses.length}
      />
    </DashboardShell>
  );
}
