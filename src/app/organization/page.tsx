import { redirect } from "next/navigation";
import { requireUserProfile } from "@/lib/guards";
import { getOrgProfileForUser } from "@/lib/org-profile";
import { OrgProfile } from "@/components/profile/org-profile";

/** The signed-in organization's own profile page (manager-editable). */
export default async function MyOrgProfilePage() {
  const { user, profile } = await requireUserProfile();
  if (profile.role !== "organization") redirect("/dashboard");

  const data = await getOrgProfileForUser(user.id);
  if (!data) redirect("/onboarding");

  return <OrgProfile data={data} isOwner={data.isManager} />;
}
