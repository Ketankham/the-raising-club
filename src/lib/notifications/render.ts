// Pure {{token}} substitution, mirroring the DB-side render_template() in
// 0032_notifications.sql. Used by the admin editor's live preview (client-safe).
// The actual emit renders in SQL so callers can never forge body text.

export function renderTemplate(tpl: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.split(`{{${key}}}`).join(value ?? ""),
    tpl ?? "",
  );
}
