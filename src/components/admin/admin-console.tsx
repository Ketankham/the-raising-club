"use client";

import { useState, useTransition } from "react";
import { Copy, UserX, UserCheck, Mail, Ban } from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import type { AdminUserRow, AdminInvitation } from "@/lib/admin";
import { deactivateUser, reactivateUser, inviteUser, revokeInvitation } from "@/lib/admin-actions";

const ROLE_BADGE: Record<string, string> = {
  parent: "bg-mint text-ink",
  caregiver: "bg-lavender text-ink",
  organization: "bg-sage/60 text-ink",
  admin: "bg-ink text-white",
};

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-ink/5 bg-white p-4">
      <p className="text-2xl font-bold text-ink">{value}</p>
      <p className="text-xs text-ink-soft">{label}</p>
    </div>
  );
}

function fmtDate(s: string | null) {
  return s ? new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
}

export function AdminConsole({
  name, users, invitations, stats,
}: {
  name: string;
  users: AdminUserRow[];
  invitations: AdminInvitation[];
  stats: { total: number; active: number; onboarded: number; byRole: Record<string, number> };
}) {
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("parent");

  const show = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const filtered = users.filter((u) => {
    const q = query.toLowerCase();
    return !q || (u.email ?? "").toLowerCase().includes(q) || u.name.toLowerCase().includes(q) || (u.role ?? "").includes(q);
  });

  function toggleActive(u: AdminUserRow) {
    start(async () => {
      const r = u.deactivated ? await reactivateUser(u.id) : await deactivateUser(u.id);
      show(r.ok ? (u.deactivated ? "User reactivated" : "User deactivated") : r.error);
    });
  }

  function sendInvite() {
    start(async () => {
      const r = await inviteUser({ email: inviteEmail, role: inviteRole });
      if (!r.ok) return show(r.error);
      setInviteEmail("");
      if (r.data?.emailed) show("Invitation email sent ✓");
      else {
        await navigator.clipboard?.writeText(r.data!.link).catch(() => {});
        show("Invite created — link copied to clipboard");
      }
    });
  }

  function copyInviteLink(token: string) {
    const link = `${window.location.origin}/onboarding?invite=${token}`;
    navigator.clipboard?.writeText(link).then(() => show("Invite link copied"));
  }

  return (
    <div className="min-h-screen bg-cream">
      <AppHeader name={name} nav={[{ href: "/admin", label: "Users" }]} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 font-display text-2xl font-bold text-ink">Admin · Users</h1>

        {/* STATS */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <Stat label="Total users" value={stats.total} />
          <Stat label="Active" value={stats.active} />
          <Stat label="Onboarded" value={stats.onboarded} />
          <Stat label="Parents" value={stats.byRole.parent ?? 0} />
          <Stat label="Caregivers" value={stats.byRole.caregiver ?? 0} />
          <Stat label="Organizations" value={stats.byRole.organization ?? 0} />
        </div>

        {/* INVITE */}
        <section className="mb-8 rounded-2xl border border-ink/5 bg-white p-6">
          <h2 className="mb-3 font-display text-lg font-semibold text-ink">Invite a user</h2>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@example.com"
              className="min-w-[220px] flex-1 rounded-lg border border-ink/15 px-3 py-2.5 text-ink outline-none focus:border-primary"
            />
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="rounded-lg border border-ink/15 px-3 py-2.5 text-ink outline-none focus:border-primary">
              <option value="parent">Parent</option>
              <option value="caregiver">Caregiver</option>
              <option value="organization">Organization</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={sendInvite} disabled={pending || !inviteEmail} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-display font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50">
              <Mail className="h-4 w-4" /> Send invite
            </button>
          </div>
          {invitations.filter((i) => i.status === "pending").length > 0 && (
            <div className="mt-4 divide-y divide-ink/5 border-t border-ink/5">
              {invitations.filter((i) => i.status === "pending").map((i) => (
                <div key={i.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-ink">{i.email} <span className="text-ink-soft">· {i.role}</span></span>
                  <span className="flex items-center gap-3">
                    <button onClick={() => copyInviteLink(i.token)} className="inline-flex items-center gap-1 text-ink-soft hover:text-ink"><Copy className="h-3.5 w-3.5" /> Copy link</button>
                    <button onClick={() => start(async () => { const r = await revokeInvitation(i.id); show(r.ok ? "Invitation revoked" : r.error); })} className="inline-flex items-center gap-1 text-ink-soft hover:text-red-600"><Ban className="h-3.5 w-3.5" /> Revoke</button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* USERS */}
        <section className="rounded-2xl border border-ink/5 bg-white p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-ink">All users ({filtered.length})</h2>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, role…" className="w-64 rounded-lg border border-ink/15 px-3 py-2 text-sm text-ink outline-none focus:border-primary" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Onboarding</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Registered</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {filtered.map((u) => (
                  <tr key={u.id} className={u.deactivated ? "opacity-60" : ""}>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-ink">{u.name}</div>
                      <div className="text-xs text-ink-soft">{u.email ?? "no email"}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_BADGE[u.role ?? ""] ?? "bg-ink/10 text-ink-soft"}`}>{u.role ?? "—"}</span>
                    </td>
                    <td className="py-3 pr-4">
                      {u.onboardingCompleted ? <span className="text-emerald-700">✓ Complete</span> : u.onboardingStatus === "in_progress" ? <span className="text-amber-600">In progress</span> : <span className="text-ink-soft">—</span>}
                    </td>
                    <td className="py-3 pr-4">{u.emailConfirmed ? <span className="text-emerald-700">Confirmed</span> : <span className="text-ink-soft">Unconfirmed</span>}</td>
                    <td className="py-3 pr-4 text-ink-soft">{fmtDate(u.registeredAt ?? u.createdAt)}</td>
                    <td className="py-3 pr-4">{u.deactivated ? <span className="text-red-600">Deactivated</span> : <span className="text-emerald-700">● Active</span>}</td>
                    <td className="py-3 pr-4 text-right">
                      {u.role !== "admin" && (
                        <button onClick={() => toggleActive(u)} disabled={pending} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${u.deactivated ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50" : "border-red-200 text-red-600 hover:bg-red-50"}`}>
                          {u.deactivated ? <><UserCheck className="h-3.5 w-3.5" /> Reactivate</> : <><UserX className="h-3.5 w-3.5" /> Deactivate</>}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <div className={`fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-white shadow-xl transition-all ${toast ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"}`}>{toast}</div>
    </div>
  );
}
