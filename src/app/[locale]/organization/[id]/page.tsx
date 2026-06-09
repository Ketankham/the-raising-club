import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrgProfileForUser, getPublicOrgProfile } from "@/lib/org-profile";
import { OrgProfile } from "@/components/profile/org-profile";

/** Public/shareable organization profile. Managers viewing their own get edit mode. */
export default async function PublicOrgProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If the viewer manages this org, show the editable owner view.
  let data = null;
  let isOwner = false;
  if (user) {
    const own = await getOrgProfileForUser(user.id);
    if (own && own.orgId === id) {
      data = own;
      isOwner = own.isManager;
    }
  }
  if (!data) data = await getPublicOrgProfile(id);
  if (!data) notFound();

  return <OrgProfile data={data} isOwner={isOwner} />;
}
