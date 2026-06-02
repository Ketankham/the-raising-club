"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Mail, Trash2, Users } from "lucide-react";
import {
  inviteFamilyMember,
  revokeFamilyInvite,
  removeFamilyMember,
  renameHousehold,
} from "@/lib/household/actions";
import type { HouseholdView } from "@/lib/household/queries";

const input = "w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary";

export function FamilyManager({ household, currentUserId }: { household: HouseholdView | null; currentUserId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [email, setEmail] = useState("");
  const [relation, setRelation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState(household?.name ?? "");

  const isOwner = household?.isOwner ?? true; // no household yet → caller becomes owner
  const seats = household?.seats;
  const seatsFull = seats ? seats.available <= 0 : false;

  function invite() {
    setError(null);
    setLink(null);
    start(async () => {
      const res = await inviteFamilyMember({ email, relationLabel: relation });
      if (res.ok) {
        setLink(res.data!.link);
        setEmail("");
        setRelation("");
        router.refresh();
      } else setError(res.error);
    });
  }

  function copy(value: string) {
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function saveName() {
    start(async () => {
      await renameHousehold(name);
      router.refresh();
    });
  }

  function revoke(id: string) {
    start(async () => {
      await revokeFamilyInvite(id);
      router.refresh();
    });
  }

  function remove(userId: string) {
    start(async () => {
      await removeFamilyMember(userId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Name + seats */}
      <section className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-ink-soft" />
          <h2 className="font-display text-lg font-bold text-ink">Your Raising Club</h2>
        </div>
        <p className="mt-1 text-sm text-ink-soft">
          Invite the adults who help raise your child — co-parents, grandparents, or trusted family. They share your family
          membership and can join the community, connect with families, and post care jobs.
        </p>

        {isOwner && (
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <label className="flex-1">
              <span className="mb-1 block text-xs text-ink-soft">Household name</span>
              <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="The Alvarez family" />
            </label>
            <button type="button" onClick={saveName} disabled={pending} className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-medium text-ink hover:bg-ink/5 disabled:opacity-50">Save</button>
          </div>
        )}

        {seats && (
          <p className="mt-4 text-sm text-ink">
            <span className="font-semibold">{seats.used}</span> of <span className="font-semibold">{seats.limit}</span> adult seats used
            {seats.pending > 0 && <span className="text-ink-soft"> · {seats.pending} pending</span>}
          </p>
        )}
      </section>

      {/* Members */}
      {household && household.members.length > 0 && (
        <section className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
          <h3 className="mb-3 font-display font-bold text-ink">Members</h3>
          <div className="divide-y divide-ink/5">
            {household.members.map((m) => (
              <div key={m.userId} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">
                    {m.name ?? m.email ?? "Member"}
                    {m.userId === currentUserId && <span className="ml-1.5 text-xs text-ink-soft">(you)</span>}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {m.role === "owner" ? "Owner" : m.relationLabel || "Adult"}
                    {m.email && ` · ${m.email}`}
                  </p>
                </div>
                {isOwner && m.role !== "owner" && (
                  <button type="button" onClick={() => remove(m.userId)} disabled={pending} className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline disabled:opacity-50">
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pending invites */}
      {household && household.invites.length > 0 && (
        <section className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
          <h3 className="mb-3 font-display font-bold text-ink">Pending invitations</h3>
          <div className="divide-y divide-ink/5">
            {household.invites.map((i) => {
              const url = `${typeof window !== "undefined" ? window.location.origin : ""}/invite/household/${i.token}`;
              return (
                <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{i.email}</p>
                    <p className="text-xs text-ink-soft">{i.relationLabel || "Adult"} · invited</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => copy(url)} className="inline-flex items-center gap-1 rounded-md border border-ink/15 px-2.5 py-1 text-xs text-ink hover:bg-ink/5">
                      <Copy className="h-3.5 w-3.5" /> Copy link
                    </button>
                    {isOwner && (
                      <button type="button" onClick={() => revoke(i.id)} disabled={pending} className="text-xs text-red-600 hover:underline disabled:opacity-50">Revoke</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Invite form */}
      {isOwner && (
        <section className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
          <h3 className="mb-1 flex items-center gap-1.5 font-display font-bold text-ink"><Mail className="h-4 w-4" /> Invite a family member</h3>
          <p className="mb-4 text-xs text-ink-soft">We&rsquo;ll generate a private link to share (email delivery is coming soon).</p>
          {seatsFull && <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">All seats are in use. Upgrade your family plan in Settings → Membership to add more adults.</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-ink-soft">Email</span>
              <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="grandma@example.com" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ink-soft">Relation (optional)</span>
              <input className={input} value={relation} onChange={(e) => setRelation(e.target.value)} placeholder="Grandparent" />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={invite} disabled={pending || !email || seatsFull} className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50">
              {pending ? "Inviting…" : "Send invite"}
            </button>
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>

          {link && (
            <div className="mt-4 rounded-lg bg-cream/70 p-3">
              <p className="mb-1.5 text-xs font-medium text-ink">Invitation link — share it with them:</p>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-md bg-white px-3 py-2 text-xs text-ink">{link}</code>
                <button type="button" onClick={() => copy(link)} className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-medium text-white">
                  {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
