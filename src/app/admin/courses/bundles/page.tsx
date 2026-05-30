import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/guards";
import { listManagedBundles } from "@/lib/courses/admin";

export default async function AdminBundlesPage() {
  await requireAdmin();
  const bundles = await listManagedBundles();

  return (
    <div>
      <Link href="/admin/courses" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft size={16} /> Back to courses
      </Link>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Learning Paths</h1>
          <p className="text-sm text-ink-soft">Bundle several courses into one path.</p>
        </div>
        <Link
          href="/admin/courses/bundles/new"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
        >
          <Plus size={16} /> Create path
        </Link>
      </div>

      {bundles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 bg-white/50 p-12 text-center">
          <p className="font-display text-lg font-bold text-ink">No learning paths yet</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-cream/60 text-left text-xs font-semibold uppercase text-ink-soft">
              <tr>
                <th className="px-4 py-3">Path</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Courses</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {bundles.map((b) => (
                <tr key={b.id} className="hover:bg-cream/40">
                  <td className="px-4 py-3 font-semibold text-ink">{b.title}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-lavender px-2.5 py-0.5 text-xs font-semibold text-ink">{b.status}</span>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{b.courseCount}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/courses/bundles/${b.id}/edit`} className="font-semibold text-primary hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
