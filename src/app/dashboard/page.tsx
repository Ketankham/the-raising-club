import { redirect } from "next/navigation";
import { requireOnboardedProfile } from "@/lib/guards";
import { ParentHome } from "@/components/home/parent-home";
import { CaregiverHome } from "@/components/home/caregiver-home";
import { OrgHome } from "@/components/home/org-home";

/** Role-aware home. The proxy guarantees a session; guards do role + onboarding. */
export default async function DashboardPage() {
  const { profile } = await requireOnboardedProfile();
  if (profile.role === "admin") redirect("/admin");

  const name = profile.preferred_name || profile.first_name || "there";

  switch (profile.role) {
    case "parent":
      return <ParentHome userId={profile.id} name={name} />;
    case "caregiver":
      return <CaregiverHome userId={profile.id} name={name} />;
    case "organization":
      return <OrgHome userId={profile.id} name={name} />;
    default:
      redirect("/onboarding");
  }
}
