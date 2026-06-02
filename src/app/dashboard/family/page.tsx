import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireOnboardedProfile } from "@/lib/guards";
import { getSettingsData } from "@/lib/settings/queries";
import { getMyHousehold } from "@/lib/household/queries";
import { DashboardShell, type Role } from "@/components/dashboard/dashboard-shell";
import { FamilyManager } from "@/components/household/family-manager";

export const metadata: Metadata = { title: "Your Raising Club — The Raising Club" };

export default async function FamilyPage() {
  const { profile, user } = await requireOnboardedProfile();
  // Households are a parent/family concept.
  if (profile.role !== "parent") redirect("/dashboard");

  const data = await getSettingsData();
  const household = await getMyHousehold();
  const name = profile.preferred_name || profile.first_name || "there";
  const initials = ((profile.preferred_name || profile.first_name || "?")[0] + (profile.last_name?.[0] ?? "")).toUpperCase();

  return (
    <DashboardShell role={data.role as Role} name={name} email={data.email} initials={initials}>
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="font-display text-3xl font-bold text-ink">Your Raising Club</h1>
          <p className="mt-1.5 text-ink-soft">Manage the adults who share your family membership.</p>
        </header>
        <FamilyManager household={household} currentUserId={user.id} />
      </div>
    </DashboardShell>
  );
}
