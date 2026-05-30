import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app/app-header";
import { PageWrap, Greeting, LaneCard, Panel } from "./home-ui";

export async function OrgHome({ userId, name }: { userId: string; name: string }) {
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, program_types, size, multi_location")
    .eq("owner_user_id", userId)
    .maybeSingle();

  let members = 0;
  let jobs = 0;
  if (org) {
    const [{ count: m }, { count: j }] = await Promise.all([
      supabase.from("organization_members").select("user_id", { count: "exact", head: true }).eq("org_id", org.id),
      supabase.from("job_posts").select("id", { count: "exact", head: true }).eq("org_id", org.id),
    ]);
    members = m ?? 0;
    jobs = j ?? 0;
  }

  return (
    <div className="min-h-screen bg-cream">
      <AppHeader name={name} nav={[{ href: "/organization", label: "Program profile" }, { href: "/organization/roles", label: "Roles" }, { href: "/organization/team", label: "Team" }, { href: "/admin/events", label: "Events" }, { href: "/courses", label: "Training" }]} />
      <PageWrap>
        <Greeting name={name} sub={org ? `${org.name} — staff, train, and grow your program.` : "Staff, train, and grow your program."} />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <LaneCard href="/organization/roles" emoji="👥" title="Staff" body="Post roles, browse caregivers, and access a bench of substitutes." tone="cream" />
          <LaneCard href="/courses" emoji="📊" title="Train" body="Assign courses, track completion, and verify badges across your team." tone="mint" />
          <LaneCard href="/organization/team" emoji="🌱" title="Grow" body="Add locations, invite staff, and scale as your program grows." tone="sage" />
          <LaneCard href="/admin/events" emoji="📅" title="Events" body="Create and manage events, registrations, rosters, and messages." tone="lavender" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Panel title="Team" action={<Link href="/organization/team" className="text-sm font-medium text-primary hover:underline">Manage</Link>}>
            <p className="text-3xl font-bold text-ink">{members}</p>
            <p className="text-sm text-ink-soft">member{members === 1 ? "" : "s"}</p>
            <Link href="/organization/team/invite" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">Invite staff →</Link>
          </Panel>
          <Panel title="Open roles" action={<Link href="/organization/roles" className="text-sm font-medium text-primary hover:underline">View</Link>}>
            <p className="text-3xl font-bold text-ink">{jobs}</p>
            <p className="text-sm text-ink-soft">job post{jobs === 1 ? "" : "s"}</p>
            <Link href="/organization/roles/new" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">Post a role →</Link>
          </Panel>
          <Panel title="Program">
            <p className="text-sm text-ink-soft">
              {org?.program_types?.length ? org.program_types.join(", ").replaceAll("_", " ") : "—"}
            </p>
            <p className="mt-2 text-xs text-ink-soft">{org?.multi_location ? "Multiple locations" : "Single location"}</p>
          </Panel>
        </div>
      </PageWrap>
    </div>
  );
}
