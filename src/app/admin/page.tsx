import { requireAdmin } from "@/lib/guards";
import { listUsers, listInvitations, summarize } from "@/lib/admin";
import { AdminConsole } from "@/components/admin/admin-console";

export default async function AdminPage() {
  await requireAdmin();
  const [users, invitations] = await Promise.all([listUsers(), listInvitations()]);
  const stats = summarize(users);

  return <AdminConsole users={users} invitations={invitations} stats={stats} />;
}
