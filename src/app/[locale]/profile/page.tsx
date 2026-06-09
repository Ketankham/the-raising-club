import { redirect } from "next/navigation";
import { requireUserProfile } from "@/lib/guards";
import { getCaregiverProfile } from "@/lib/profile";
import { CaregiverProfile } from "@/components/profile/caregiver-profile";

/** Owner view of the signed-in caregiver's own profile (editable). */
export default async function MyProfilePage() {
  const { user, profile } = await requireUserProfile();
  if (profile.role !== "caregiver") redirect("/dashboard");

  const data = await getCaregiverProfile(user.id);
  if (!data) redirect("/onboarding");

  return <CaregiverProfile data={data} isOwner />;
}
