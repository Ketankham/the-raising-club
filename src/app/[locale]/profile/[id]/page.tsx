import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCaregiverProfile, getPublicCaregiverProfile } from "@/lib/profile";
import { CaregiverProfile } from "@/components/profile/caregiver-profile";

/** Public/shareable caregiver profile. Owner viewing their own id gets edit mode. */
export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = !!user && user.id === id;
  const data = isOwner ? await getCaregiverProfile(id) : await getPublicCaregiverProfile(id);
  if (!data) notFound();

  return <CaregiverProfile data={data} isOwner={isOwner} />;
}
