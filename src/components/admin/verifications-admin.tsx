"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { BadgeCheck, ShieldCheck, AlertTriangle, Clock, CheckCircle, XCircle, UserX, ChevronDown, ChevronRight } from "lucide-react";
import type { AdminVerificationRow } from "@/lib/admin";
import { FileText } from "lucide-react";
import { adminApproveVerification, adminDepublishCaregiver, adminGenerateReport } from "@/lib/authenticate/actions";

const TYPE_LABEL: Record<string, string> = {
  identity: "Identity",
  background_check: "Background Check",
  reference: "Reference",
};

const STATUS_COLOR: Record<string, string> = {
  verified: "bg-[#dcebc6] text-[#4f6b15]",
  pending: "bg-[#fdeede] text-[#9a5a2a]",
  failed: "bg-[#fce9f0] text-[#9a2a5a]",
  not_started: "bg-white/60 text-ink-soft",
  expired: "bg-ink/10 text-ink-soft",
};

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="rounded-xl border border-ink/5 bg-white p-4">
      <p className={`text-2xl font-bold ${accent ?? "text-ink"}`}>{value}</p>
      <p className="text-xs text-ink-soft">{label}</p>
    </div>
  );
}

export function VerificationsAdmin({ rows }: { rows: AdminVerificationRow[] }) {
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "red_flags" | "review" | "verified">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState<string | null>(null);

  const show = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2600); };

  const redFlags = rows.filter((r) => r.redFlag);
  const reviewRequired = rows.filter((r) => r.adminReviewRequired && !r.redFlag);
  const verified = rows.filter((r) => r.status === "verified");

  const filtered = filter === "red_flags" ? rows.filter((r) => r.redFlag)
    : filter === "review" ? rows.filter((r) => r.adminReviewRequired)
    : filter === "verified" ? rows.filter((r) => r.status === "verified")
    : rows;

  function handleApprove(verificationId: string) {
    start(async () => {
      const res = await adminApproveVerification(verificationId);
      show(res.ok ? "Approved — no further action needed" : (res.error ?? "Error"));
    });
  }

  function handleDepublish(userId: string) {
    if (!confirm("Depublish this caregiver? Their profile will be hidden from the marketplace.")) return;
    start(async () => {
      const res = await adminDepublishCaregiver(userId);
      show(res.ok ? "Caregiver depublished" : (res.error ?? "Error"));
    });
  }

  function handleGenerateReport(userCode: string) {
    setReportLoading(userCode);
    start(async () => {
      const res = await adminGenerateReport(userCode);
      setReportLoading(null);
      if (res.ok) {
        window.open(res.url, "_blank", "noopener");
      } else {
        show(res.error ?? "Could not generate report");
      }
    });
  }

  return (
    <div>
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">Verifications</h1>
        <p className="mt-1 text-sm text-ink-soft">Identity and background check status for all caregivers. Red flags require immediate attention.</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total verifications" value={rows.length} />
        <Stat label="Verified" value={verified.length} />
        <Stat label="Needs review" value={reviewRequired.length} accent={reviewRequired.length > 0 ? "text-[#9a5a2a]" : undefined} />
        <Stat label="Red flags" value={redFlags.length} accent={redFlags.length > 0 ? "text-red-600" : undefined} />
      </div>

      {/* Red flag alert bar */}
      {redFlags.length > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl bg-red-50 border border-red-200 px-4 py-3.5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-semibold text-red-800">
              {redFlags.length} red flag{redFlags.length !== 1 ? "s" : ""} detected
            </p>
            <p className="mt-0.5 text-xs text-red-700">
              Sex offender matches are auto-deactivated immediately. Criminal records require your manual review.
            </p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {([
          ["all", "All", rows.length],
          ["red_flags", "Red Flags", redFlags.length],
          ["review", "Needs Review", reviewRequired.length],
          ["verified", "Verified", verified.length],
        ] as const).map(([val, label, count]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
              filter === val
                ? "bg-ink text-white"
                : "bg-white border border-ink/15 text-ink-soft hover:text-ink"
            } ${val === "red_flags" && redFlags.length > 0 ? "border-red-300" : ""}`}
          >
            {label} <span className="ml-1 opacity-60">{count}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-sm text-ink-soft">No verifications found for this filter.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/5 text-left text-xs text-ink-soft">
                <th className="px-4 py-3 font-medium">Caregiver</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Flags</th>
                <th className="px-4 py-3 font-medium">Profile</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {filtered.map((row) => {
                const isOpen = expanded === row.verificationId;
                const rowBg = row.redFlag ? "bg-red-50/50" : row.adminReviewRequired ? "bg-[#fdeede]/30" : "";
                return (
                  <>
                    <tr key={row.verificationId} className={rowBg}>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setExpanded(isOpen ? null : row.verificationId)}
                          className="flex items-center gap-1 text-left"
                        >
                          {isOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-ink-soft" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-soft" />}
                          <span>
                            <Link href={`/admin/users/${row.userId}`} onClick={(e) => e.stopPropagation()} className="font-medium text-ink hover:underline">
                              {row.name}
                            </Link>
                            <p className="text-xs text-ink-soft">{row.email}</p>
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-ink-soft">
                          {row.type === "identity" ? <BadgeCheck className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                          {TYPE_LABEL[row.type] ?? row.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLOR[row.status] ?? "bg-ink/10 text-ink-soft"}`}>
                          {row.status === "verified" && <CheckCircle className="h-3 w-3" />}
                          {row.status === "failed" && <XCircle className="h-3 w-3" />}
                          {row.status === "pending" && <Clock className="h-3 w-3" />}
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {row.redFlag && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                            <AlertTriangle className="h-3 w-3" />
                            {row.redFlagType === "sex_offender" ? "Sex Offender" : "Criminal Record"}
                          </span>
                        )}
                        {row.adminReviewRequired && !row.redFlag && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#fdeede] px-2.5 py-1 text-xs font-medium text-[#9a5a2a]">
                            Review needed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.isDeactivated ? (
                          <span className="flex items-center gap-1 text-xs text-red-600"><UserX className="h-3.5 w-3.5" /> Deactivated</span>
                        ) : row.isPublished ? (
                          <span className="text-xs text-[#4f6b15]">Published</span>
                        ) : (
                          <span className="text-xs text-ink-soft">Unpublished</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-soft">{fmtDate(row.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {row.adminReviewRequired && (
                            <button
                              disabled={pending}
                              onClick={() => handleApprove(row.verificationId)}
                              className="rounded-full bg-[#dcebc6] px-3 py-1 text-xs font-semibold text-[#4f6b15] transition hover:brightness-95 disabled:opacity-60"
                            >
                              Approve
                            </button>
                          )}
                          {!row.isDeactivated && row.status === "failed" && (
                            <button
                              disabled={pending}
                              onClick={() => handleDepublish(row.userId)}
                              className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 transition hover:brightness-95 disabled:opacity-60"
                            >
                              Depublish
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={`${row.verificationId}-detail`} className={`${rowBg} border-t-0`}>
                        <td colSpan={7} className="px-6 pb-4 pt-0">
                          <div className="rounded-xl border border-ink/8 bg-white/70 p-3.5 text-xs">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
                              <div><span className="text-ink-soft">Provider</span><p className="font-medium text-ink">{row.provider ?? "—"}</p></div>
                              <div><span className="text-ink-soft">Reference / User Code</span><p className="font-mono font-medium text-ink break-all">{row.reference ?? "—"}</p></div>
                              <div><span className="text-ink-soft">Reviewed at</span><p className="font-medium text-ink">{row.reviewedAt ? fmtDate(row.reviewedAt) : "—"}</p></div>
                            </div>
                            {row.metadata && (
                              <details className="mt-3">
                                <summary className="cursor-pointer text-ink-soft hover:text-ink">Raw metadata</summary>
                                <pre className="mt-1.5 overflow-x-auto rounded-lg bg-ink/5 p-2 text-[10px] text-ink">{JSON.stringify(row.metadata, null, 2)}</pre>
                              </details>
                            )}
                            <div className="mt-3 flex flex-wrap gap-3 items-center">
                              <Link href={`/admin/users/${row.userId}`} className="text-[#4f6b15] hover:underline">View user profile →</Link>
                              {row.reference && (
                                row.reportUrl ? (
                                  <a href={row.reportUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full bg-ink/8 px-3 py-1 text-xs font-medium text-ink hover:bg-ink/15">
                                    <FileText className="h-3 w-3" /> View Report (PDF)
                                  </a>
                                ) : (
                                  <button
                                    disabled={reportLoading === row.reference || pending}
                                    onClick={() => handleGenerateReport(row.reference!)}
                                    className="inline-flex items-center gap-1 rounded-full bg-ink/8 px-3 py-1 text-xs font-medium text-ink hover:bg-ink/15 disabled:opacity-60"
                                  >
                                    <FileText className="h-3 w-3" />
                                    {reportLoading === row.reference ? "Generating…" : "Generate Report"}
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
