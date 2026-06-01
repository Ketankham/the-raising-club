import Link from "next/link";
import { BookPlus, Star, Layers } from "lucide-react";
import { requireAdmin } from "@/lib/guards";
import { listManagedCourses } from "@/lib/courses/admin";

export default async function AdminCoursesPage() {
  await requireAdmin();
  const courses = await listManagedCourses();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Courses</h1>
          <p className="text-sm text-ink-soft">Create and manage learning content.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/courses/bundles"
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink-soft hover:text-ink"
          >
            <Layers size={16} /> Learning Paths
          </Link>
          <Link
            href="/admin/courses/new"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
          >
            <BookPlus size={16} /> Create course
          </Link>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 bg-white/50 p-12 text-center">
          <p className="font-display text-lg font-bold text-ink">No courses yet</p>
          <p className="mt-1 text-sm text-ink-soft">Create your first course to get started.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-cream/60 text-left text-xs font-semibold uppercase text-ink-soft">
              <tr>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Chapters</th>
                <th className="px-4 py-3">Modules</th>
                <th className="px-4 py-3">Enrolled</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {courses.map((c) => (
                <tr key={c.id} className="hover:bg-cream/40">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 font-semibold text-ink">
                      {c.isFeatured && <Star size={13} className="fill-yellow text-yellow" />}
                      {c.title}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-lavender px-2.5 py-0.5 text-xs font-semibold text-ink">{c.status}</span>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{c.chapterCount}</td>
                  <td className="px-4 py-3 text-ink-soft">{c.moduleCount}</td>
                  <td className="px-4 py-3 text-ink-soft">{c.enrollmentCount}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <a
                      href={`/admin/courses/${c.id}/preview`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#7ba84f] hover:underline"
                      title="Preview the course as a learner (admin only)"
                    >
                      Preview
                    </a>
                    <span className="mx-2 text-ink-soft/40">·</span>
                    <Link href={`/admin/courses/${c.id}/edit`} className="font-semibold text-primary hover:underline">
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
