import { PlayCircle } from "lucide-react";
import type { CourseVideoProvider } from "@/lib/courses/types";

function embedUrl(provider: CourseVideoProvider, url: string): string | null {
  try {
    if (provider === "youtube") {
      const m =
        url.match(/[?&]v=([\w-]{6,})/) ||
        url.match(/youtu\.be\/([\w-]{6,})/) ||
        url.match(/youtube\.com\/embed\/([\w-]{6,})/);
      return m ? `https://www.youtube.com/embed/${m[1]}` : null;
    }
    if (provider === "vimeo") {
      const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      return m ? `https://player.vimeo.com/video/${m[1]}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

/** Embedded YouTube/Vimeo player, 16:9. */
export function VideoEmbed({
  provider,
  url,
  title,
}: {
  provider: CourseVideoProvider | null;
  url: string | null;
  title?: string;
}) {
  const src = provider && url ? embedUrl(provider, url) : null;
  if (!src) {
    return (
      <div className="grid aspect-video w-full place-items-center rounded-2xl bg-ink/5 text-ink-soft/40">
        <PlayCircle size={56} />
      </div>
    );
  }
  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
      <iframe
        src={src}
        title={title ?? "Course video"}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
