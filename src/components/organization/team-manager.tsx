"use client";

import { useState, useTransition } from "react";
import { Copy, Ban, Mail, UserRound } from "lucide-react";
import type { TeamData } from "@/lib/org-team";
import { inviteStaff, revokeStaffInvite } from "@/lib/org-team-actions";

export function TeamManager({ team }: { team: TeamData }) {
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const show = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  function send() {
    start(async () => {
      const r = await inviteStaff(email);
      if (!r.ok) return show(r.error);
      setEmail("");
      await navigator.clipboard?.writeText(`${window.location.origin}${new URL(r.data!.link, window.location.origin).pathname}`).catch(() => {});
      show("Invite created — link copied to clipboard");
    });
  }
  function copyLink(token: string) {
    navigator.clipboard?.writeText(`${window.location.origin}/invite/staff/${token}`).then(() => show("Invite link copied"));
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl font-bold text-ink">Team — {team.orgName}</h1>
      <p className="mt-1 text-ink-soft">Invite staff and manage who's part of your program.</p>

      {/* INVITE */}
      <section className="mt-6 rounded-2xl border border-ink/8 bg-white p-6">
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">Invite a staff member</h2>
        <div className="flex flex-wrap items-center gap-3">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@email.com" className="min-w-[220px] flex-1 rounded-lg border border-ink/15 px-3 py-2.5 text-ink outline-none focus:border-primary" />
          <button onClick={send} disabled={pending || !email} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-display font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"><Mail className="h-4 w-4" /> Send invite</button>
        </div>
        {team.invites.length > 0 && (
          <div className="mt-4 divide-y divide-ink/5 border-t border-ink/5">
            {team.invites.map((i) => (
              <div key={i.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-ink">{i.email} <span className="text-ink-soft">· pending</span></span>
                <span className="flex items-center gap-3">
                  <button onClick={() => copyLink(i.token)} className="inline-flex items-center gap-1 text-ink-soft hover:text-ink"><Copy className="h-3.5 w-3.5" /> Copy link</button>
                  <button onClick={() => start(async () => { const r = await revokeStaffInvite(i.id); show(r.ok ? "Invitation revoked" : r.error); })} className="inline-flex items-center gap-1 text-ink-soft hover:text-red-600"><Ban className="h-3.5 w-3.5" /> Revoke</button>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MEMBERS */}
      <section className="mt-6 rounded-2xl border border-ink/8 bg-white p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">Members ({team.members.length})</h2>
        <ul className="divide-y divide-ink/5">
          {team.members.map((m) => (
            <li key={m.userId} className="flex items-center justify-between py-3">
              <span className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-cream text-ink-soft"><UserRound className="h-4 w-4" /></span>
                <span>
                  <span className="block text-sm font-medium text-ink">{m.name ?? "Member"}</span>
                  <span className="text-xs text-ink-soft">{m.email}</span>
                </span>
              </span>
              <span className="flex items-center gap-3 text-xs">
                <span className="rounded-full bg-lavender px-2.5 py-1 font-medium text-purple capitalize">{m.role}</span>
                <span className={m.status === "active" ? "text-emerald-700" : "text-ink-soft"}>● {m.status}</span>
              </span>
            </li>
          ))}
          {team.members.length === 0 && <li className="py-3 text-sm text-ink-soft">No members yet.</li>}
        </ul>
      </section>

      <div className={`fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-white shadow-xl transition-all ${toast ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"}`}>{toast}</div>
    </div>
  );
}
