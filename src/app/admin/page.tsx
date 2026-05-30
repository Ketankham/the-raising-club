import { requireAdmin } from "@/lib/guards";
import { listUsers, listInvitations, summarize } from "@/lib/admin";
import { AdminConsole } from "@/components/admin/admin-console";

export default async function AdminPage() {
  const { profile } = await requireAdmin();
  const [users, invitations] = await Promise.all([listUsers(), listInvitations()]);
  const stats = summarize(users);
  const name = profile.preferred_name || profile.first_name || "Admin";

  return <AdminConsole name={name} users={users} invitations={invitations} stats={stats} />;
}
