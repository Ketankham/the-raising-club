import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireOnboardedProfile } from "@/lib/guards";
import { getSettingsData } from "@/lib/settings/queries";
import { plansForRole } from "@/lib/plans/queries";
import { getMyEntitlement } from "@/lib/entitlement/queries";
import { DashboardShell, type Role } from "@/components/dashboard/dashboard-shell";
import {
  PersonalDetailsSection,
  AccountSection,
  SecuritySection,
  MembershipSection,
  ParentPreferencesSection,
  ProfileLinkSection,
} from "@/components/settings/settings-sections";

export const metadata: Metadata = { title: "Settings — The Raising Club" };

export default async function SettingsPage() {
  const { profile } = await requireOnboardedProfile();
  if (profile.role === "admin") redirect("/admin");

  const [data, entitlement] = await Promise.all([getSettingsData(), getMyEntitlement()]);
  const role = data.role as Role;
  const name = profile.preferred_name || profile.first_name || "there";
  const initials = ((profile.preferred_name || profile.first_name || "?")[0] + (profile.last_name?.[0] ?? "")).toUpperCase();

  const memberSince = data.registeredAt
    ? new Date(data.registeredAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  return (
    <DashboardShell role={role} name={name} email={data.email} initials={initials}>
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="font-display text-3xl font-bold text-ink">Settings</h1>
          <p className="mt-1.5 text-ink-soft">Manage your personal details, account, and membership.</p>
        </header>

        <div className="space-y-6">
          <PersonalDetailsSection
            firstName={data.firstName ?? ""}
            lastName={data.lastName ?? ""}
            preferredName={data.preferredName ?? ""}
            phone={data.phone ?? ""}
            zip={data.zip ?? ""}
          />

          {data.role === "parent" && data.parent && (
            <ParentPreferencesSection childTerm={data.parent.childTerm ?? ""} intents={data.parent.intents} />
          )}

          {data.role === "caregiver" && (
            <ProfileLinkSection
              title="Your public profile"
              body="Your professional profile — headline, experience, availability, and credentials — is managed separately."
              href="/profile"
              cta="Edit public profile"
            />
          )}

          {data.role === "organization" && (
            <ProfileLinkSection
              title="Your organization profile"
              body="Program details, locations, and team are managed on your organization page."
              href="/organization"
              cta="Manage organization"
            />
          )}

          <AccountSection email={data.email ?? ""} role={data.role} memberSince={memberSince} />

          <SecuritySection />

          <MembershipSection
            plans={await plansForRole(data.role)}
            currentPlanKey={data.planKey}
            currentInterval={data.planInterval}
            status={entitlement.status}
            entitlementUntil={entitlement.entitlementUntil}
          />
        </div>
      </div>
    </DashboardShell>
  );
}
