import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "./dashboard-shell";

function Card({ href, emoji, title, body }: { href: string; emoji: string; title: string; body: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-ink/8 bg-white p-5 transition hover:shadow-sm">
      <div className="text-2xl">{emoji}</div>
      <h3 className="mt-3 font-display font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-ink-soft">{body}</p>
    </Link>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-2xl border border-ink/8 bg-white p-5">
      <p className="text-2xl font-bold text-ink">{value}</p>
      <p className="text-sm text-ink-soft">{label}</p>
    </div>
  );
}

const CARDS: Record<Role, { href: string; emoji: string; title: string; body: string }[]> = {
  parent: [
    { href: "/connect", emoji: "🔍", title: "Find care", body: "Explore caregivers, shared care, or nearby families." },
    { href: "/events", emoji: "📍", title: "Events & community", body: "Join playdates, gatherings, and activities near you." },
    { href: "/courses", emoji: "📚", title: "Learn", body: "Practical courses on child development and routines." },
  ],
  caregiver: [
    { href: "/profile", emoji: "🪪", title: "My profile", body: "View and strengthen your professional profile." },
    { href: "/jobs", emoji: "💼", title: "Find jobs", body: "Apply to family and program roles that fit you." },
    { href: "/courses", emoji: "📚", title: "Learn & grow", body: "Short trainings designed for real caregiving life." },
  ],
  organization: [
    { href: "/organization", emoji: "🏫", title: "Program profile", body: "Manage your program's public profile." },
    { href: "/connect", emoji: "👥", title: "Find caregivers", body: "Browse and connect with trained caregivers." },
    { href: "/courses", emoji: "📊", title: "Training", body: "Assign courses and track your team's progress." },
  ],
};

export async function DashboardHome({ role, userId, name }: { role: Role; userId: string; name: string }) {
  const supabase = await createClient();

  let extra: { value: string | number; label: string }[] = [];
  if (role === "parent") {
    const { count } = await supabase.from("children").select("id", { count: "exact", head: true }).eq("parent_user_id", userId);
    extra = [{ value: count ?? 0, label: count === 1 ? "child" : "children" }];
  } else if (role === "caregiver") {
    const { data } = await supabase.from("caregiver_profiles").select("is_published").eq("user_id", userId).maybeSingle();
    extra = [{ value: data?.is_published ? "Public" : "Private", label: "profile status" }];
  } else if (role === "organization") {
    const { data: org } = await supabase.from("organizations").select("id").eq("owner_user_id", userId).maybeSingle();
    const count = org ? (await supabase.from("organization_members").select("user_id", { count: "exact", head: true }).eq("org_id", org.id)).count : 0;
    extra = [{ value: count ?? 0, label: "team members" }];
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-2xl font-bold text-ink">Welcome back, {name} 👋</h1>
      <p className="mt-1 text-ink-soft">Here's what you can do today.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {CARDS[role].map((c) => <Card key={c.title} {...c} />)}
      </div>

      {extra.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {extra.map((s) => <Stat key={s.label} {...s} />)}
        </div>
      )}
    </div>
  );
}
