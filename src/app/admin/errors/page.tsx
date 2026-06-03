import { requireAdmin } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { AlertTriangle } from "lucide-react";

interface ErrorLog {
  id: string;
  created_at: string;
  user_id: string | null;
  page_url: string | null;
  component: string | null;
  error_type: string | null;
  message: string;
  stack: string | null;
  metadata: Record<string, unknown>;
  profiles?: { first_name: string | null; last_name: string | null; email: string | null } | null;
}

const TYPE_STYLE: Record<string, string> = {
  react_boundary: "bg-red-100 text-red-700",
  unhandled_rejection: "bg-orange-100 text-orange-700",
  action_failure: "bg-yellow-100 text-yellow-700",
  network: "bg-blue-100 text-blue-700",
  unknown: "bg-ink/10 text-ink-soft",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export default async function AdminErrorsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const sp1 = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) ?? "";

  const supabase = await createClient();

  let query = supabase
    .from("user_error_logs")
    .select(
      `id, created_at, user_id, page_url, component, error_type, message, stack, metadata,
       profiles ( first_name, last_name, email )`,
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const typeFilter = sp1("type");
  if (typeFilter) query = query.eq("error_type", typeFilter);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await query;
  const logs: ErrorLog[] = (data ?? []) as unknown as ErrorLog[];

  const stats = {
    total: logs.length,
    react: logs.filter((l) => l.error_type === "react_boundary").length,
    unhandled: logs.filter((l) => l.error_type === "unhandled_rejection").length,
    unique_users: new Set(logs.map((l) => l.user_id).filter(Boolean)).size,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">Error Logs</h1>
        <p className="text-sm text-ink-soft">All errors captured from the app, newest first.</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total errors", value: stats.total },
          { label: "React crashes", value: stats.react },
          { label: "Unhandled rejections", value: stats.unhandled },
          { label: "Affected users", value: stats.unique_users },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-ink">{s.value}</p>
            <p className="text-xs text-ink-soft">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Type filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {["", "react_boundary", "unhandled_rejection", "action_failure", "network", "unknown"].map((t) => (
          <a
            key={t}
            href={t ? `?type=${t}` : "?"}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              typeFilter === t
                ? "border-ink bg-ink text-white"
                : "border-ink/15 text-ink-soft hover:border-ink/30 hover:text-ink"
            }`}
          >
            {t || "All"}
          </a>
        ))}
      </div>

      {logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 bg-white/50 p-12 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-ink-soft/50" />
          <p className="mt-3 font-display text-lg font-bold text-ink">No errors logged</p>
          <p className="mt-1 text-sm text-ink-soft">Errors from the app will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const userName = log.profiles
              ? [log.profiles.first_name, log.profiles.last_name].filter(Boolean).join(" ") || log.profiles.email || "Unknown user"
              : log.user_id ? "User (profile missing)" : "Anonymous";

            return (
              <details key={log.id} className="group rounded-2xl border border-ink/5 bg-white shadow-sm">
                <summary className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3 hover:bg-cream/40">
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLE[log.error_type ?? "unknown"] ?? TYPE_STYLE.unknown}`}>
                    {log.error_type ?? "unknown"}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                    {log.message}
                  </span>
                  <span className="shrink-0 text-xs text-ink-soft">{userName}</span>
                  <span className="shrink-0 text-xs text-ink-soft">{fmt(log.created_at)}</span>
                </summary>

                <div className="border-t border-ink/5 px-4 pb-4 pt-3">
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase text-ink-soft">Page</p>
                      <p className="truncate text-ink">{log.page_url ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-ink-soft">Component</p>
                      <p className="text-ink">{log.component ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-ink-soft">User</p>
                      <p className="text-ink">
                        {userName}
                        {log.profiles?.email && <span className="ml-1 text-xs text-ink-soft">({log.profiles.email})</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-ink-soft">Time</p>
                      <p className="text-ink">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  {log.stack && (
                    <div className="mt-3">
                      <p className="mb-1 text-xs font-semibold uppercase text-ink-soft">Stack trace</p>
                      <pre className="max-h-48 overflow-y-auto rounded-lg bg-ink/5 p-3 text-[11px] leading-relaxed text-ink">
                        {log.stack}
                      </pre>
                    </div>
                  )}
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="mt-3">
                      <p className="mb-1 text-xs font-semibold uppercase text-ink-soft">Metadata</p>
                      <pre className="max-h-32 overflow-y-auto rounded-lg bg-ink/5 p-3 text-[11px] text-ink">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
