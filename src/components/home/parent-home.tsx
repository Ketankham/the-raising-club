import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app/app-header";
import { PageWrap, Greeting, LaneCard, Panel } from "./home-ui";

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function ageLabel(month: number | null, year: number | null): string {
  if (!year) return "";
  const now = new Date();
  let months = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - (month ?? 1));
  if (months < 0) months = 0;
  if (months < 24) return `${months} mo`;
  return `${Math.floor(months / 12)} yr`;
}

export async function ParentHome({ userId, name }: { userId: string; name: string }) {
  const supabase = await createClient();
  const [{ data: kids }, { data: parent }] = await Promise.all([
    supabase.from("children").select("*").eq("parent_user_id", userId).order("position"),
    supabase.from("parent_profiles").select("child_term, intents").eq("user_id", userId).maybeSingle(),
  ]);

  return (
    <div className="min-h-screen bg-cream">
      <AppHeader name={name} nav={[{ href: "/connect", label: "Connect" }, { href: "/events", label: "Events" }, { href: "/courses", label: "Learn" }]} />
      <PageWrap>
        <Greeting name={name} sub="Here's how families usually get started." />

        <div className="grid gap-4 sm:grid-cols-3">
          <LaneCard href="/connect" emoji="🔍" title="Find care" body="Explore caregivers, shared-care options, or nearby families." tone="cream" />
          <LaneCard href="/events" emoji="📍" title="Events & community" body="Join playdates, family gatherings, or child-centered activities near you." tone="mint" />
          <LaneCard href="/courses" emoji="📚" title="Learn" body="Practical courses on child development, routines, and everyday care." tone="sage" />
        </div>

        <div className="mt-8">
          <Panel title={`Your child${(kids?.length ?? 0) === 1 ? "" : "ren"}`}>
            {kids && kids.length > 0 ? (
              <ul className="flex flex-wrap gap-3">
                {kids.map((k) => (
                  <li key={k.id} className="rounded-xl border border-ink/10 px-4 py-3">
                    <p className="font-medium text-ink">{k.pet_name || "Child"}</p>
                    <p className="text-xs text-ink-soft">
                      {k.birth_month ? `${MONTHS[k.birth_month]} ${k.birth_year}` : k.birth_year}
                      {k.birth_year ? ` · ${ageLabel(k.birth_month, k.birth_year)}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-soft">No children added yet.</p>
            )}
            {parent?.child_term && (
              <p className="mt-3 text-xs text-ink-soft">They call you <span className="font-medium text-ink">{parent.child_term}</span>.</p>
            )}
          </Panel>
        </div>
      </PageWrap>
    </div>
  );
}
