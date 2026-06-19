import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SUPPORT_NEED_LABELS, type SupportNeed } from "@/lib/events/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * CSV export of an event's roster (one row per child; adult-only registrations
 * get a single row). RLS limits the data to events the caller can manage, so a
 * non-manager simply gets an empty file. Linked from the roster page.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { data: ev } = await supabase
    .from("events")
    .select("title, slug, org_id")
    .eq("id", id)
    .maybeSingle();

  if (!ev) return new NextResponse("Not found", { status: 404 });

  // Explicit authorization check — don't rely on RLS alone for children's PII.
  // Platform admins pass; org owners/admins of the event's org pass.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isPlatformAdmin = profile?.role === "admin";
  if (!isPlatformAdmin && ev.org_id) {
    const { data: membership } = await supabase
      .from("organization_members")
      .select("member_role")
      .eq("org_id", ev.org_id)
      .eq("user_id", user.id)
      .in("member_role", ["owner", "admin"])
      .eq("status", "active")
      .maybeSingle();
    if (!membership) return new NextResponse("Forbidden", { status: 403 });
  } else if (!isPlatformAdmin) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { data: regs } = await supabase
    .from("event_registrations")
    .select(
      `id, status, adult_count, contact_email, contact_phone, registered_at,
       event_registration_children ( display_pet_name, birth_month, birth_year, support_needs, attendance_status ),
       emergency_contacts ( name, phone ),
       authorized_pickups ( name, phone ),
       event_payments ( status, amount_cents, currency )`,
    )
    .eq("event_id", id)
    .order("registered_at", { ascending: true });

  const headers = [
    "Registration ID",
    "Status",
    "Registered date",
    "Registered time",
    "Adults",
    "Contact email",
    "Contact phone",
    "Child",
    "Child age",
    "Attendance",
    "Support needs",
    "Payment status",
    "Amount",
    "Currency",
    "Emergency contact",
    "Authorized pickup",
  ];

  const rows: string[][] = [];
  for (const r of regs ?? []) {
    const reg = r as any;
    const d = new Date(reg.registered_at);
    const date = d.toLocaleDateString("en-US");
    const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const payment = (reg.event_payments ?? [])[0];
    const payStatus = payment?.status ?? "none";
    const amount = payment ? (payment.amount_cents / 100).toFixed(2) : "0.00";
    const currency = payment?.currency?.toUpperCase() ?? "USD";
    const emergency = (reg.emergency_contacts ?? [])
      .map((e: any) => `${e.name} ${e.phone}`)
      .join("; ");
    const pickup = (reg.authorized_pickups ?? [])
      .map((p: any) => `${p.name} ${p.phone}`)
      .join("; ");

    const base = [
      reg.id,
      reg.status,
      date,
      time,
      String(reg.adult_count ?? ""),
      reg.contact_email ?? "",
      reg.contact_phone ?? "",
    ];

    const children = reg.event_registration_children ?? [];
    if (children.length === 0) {
      rows.push([...base, "", "", "", "", payStatus, amount, currency, emergency, pickup]);
      continue;
    }
    for (const c of children) {
      const needs = (c.support_needs ?? [])
        .map((s: SupportNeed) => SUPPORT_NEED_LABELS[s] ?? s)
        .join("; ");
      rows.push([
        ...base,
        c.display_pet_name ?? "",
        childAge(c.birth_month, c.birth_year),
        c.attendance_status ?? "",
        needs,
        payStatus,
        amount,
        currency,
        emergency,
        pickup,
      ]);
    }
  }

  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const filename = `roster-${ev?.slug ?? id}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function csvCell(value: string): string {
  // Neutralize CSV formula injection (=, +, -, @ at the start of a cell).
  let v = (value ?? "").replace(/^([=+\-@])/, "'$1");
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function childAge(month: number | null, year: number | null): string {
  if (!year) return "";
  const now = new Date();
  let months = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - (month ?? 1));
  if (months < 0) months = 0;
  return months < 24 ? `${months} mo` : `${Math.floor(months / 12)} yr`;
}
