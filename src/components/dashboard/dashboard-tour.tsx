"use client";

import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

/**
 * First-run dashboard tour (Figma p56–57): a welcome modal, then three
 * one-by-one coachmarks spotlighting the Connect / Learn / Events cards.
 * Shown once per browser, then hidden forever via localStorage.
 */
const STORAGE_KEY = "trc_dashboard_tour_v1";

type Step = { target: string; title: string; body: string };

const STEPS: Step[] = [
  {
    target: "connect",
    title: "Looking for care",
    body: "Connect with caregivers and educators, meet nearby families, or explore shared care for nanny shares.",
  },
  {
    target: "learn",
    title: "Looking to learn",
    body: "Browse Learn for practical courses on child development, routines, and everyday care.",
  },
  {
    target: "events",
    title: "Looking for activities or community",
    body: "Visit Events to join playdates, family gatherings, or child-centered activities near you.",
  },
];

const TOOLTIP_W = 340;

// localStorage-backed "already seen" flag, read without setState-in-effect.
const subscribeSeen = () => () => {};
const seenSnapshot = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true;
  }
};
const seenServerSnapshot = () => true;

export function DashboardTour() {
  const seen = useSyncExternalStore(subscribeSeen, seenSnapshot, seenServerSnapshot);
  const [closed, setClosed] = useState(false);
  const [view, setView] = useState<"intro" | "steps">("intro");
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const active = !seen && !closed;

  const measure = useCallback(() => {
    const el = document.querySelector(`[data-tour="${STEPS[stepIdx].target}"]`);
    if (el) setRect(el.getBoundingClientRect());
  }, [stepIdx]);

  useEffect(() => {
    if (!active || view !== "steps") return;
    const el = document.querySelector(`[data-tour="${STEPS[stepIdx].target}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    const raf = requestAnimationFrame(measure);
    const t = setTimeout(measure, 350);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [active, view, stepIdx, measure]);

  const finish = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setClosed(true);
  }, []);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, finish]);

  if (!active) return null;

  if (view === "intro") {
    return (
      <div className="fixed inset-0 z-[100] grid place-items-center bg-ink/55 px-5">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Welcome to your dashboard"
          className="w-full max-w-md rounded-3xl bg-cream p-8 text-center shadow-xl"
        >
          <h2 className="font-serif text-2xl font-semibold leading-snug text-ink sm:text-3xl">
            You&rsquo;re in! Now, let&rsquo;s find what you need
          </h2>
          <p className="mt-3 text-ink-soft">
            Here&rsquo;s how families usually get started.
          </p>
          <p className="mt-5 text-xs text-ink-soft">
            ⓘ You can start anywhere — and switch paths anytime.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setStepIdx(0);
                setView("steps");
              }}
              className="rounded-full bg-ink px-8 py-3 font-display font-semibold text-white transition hover:bg-ink-soft"
            >
              Start Exploring
            </button>
            <button
              type="button"
              onClick={finish}
              className="text-sm font-medium text-ink-soft underline-offset-2 hover:underline"
            >
              Skip the tour
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- coachmark steps ----
  const step = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;

  let spotlight: React.CSSProperties | null = null;
  let tooltipPos: React.CSSProperties | null = null;
  let caretLeft = TOOLTIP_W / 2;
  let placeBelow = true;

  if (rect) {
    const pad = 10;
    spotlight = {
      top: rect.top - pad,
      left: rect.left - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
    };

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.min(Math.max(rect.left, 16), vw - TOOLTIP_W - 16);
    placeBelow = rect.bottom + 200 <= vh;
    tooltipPos = placeBelow
      ? { top: rect.bottom + 16, left }
      : { bottom: vh - rect.top + 16, left };
    caretLeft = Math.min(Math.max(rect.left + rect.width / 2 - left, 24), TOOLTIP_W - 24);
  }

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label={step.title}>
      {/* click-blocking layer */}
      <div className="absolute inset-0" />

      {rect && spotlight && (
        <div
          className="pointer-events-none absolute rounded-2xl ring-2 ring-yellow/70"
          style={{ ...spotlight, boxShadow: "0 0 0 9999px rgba(55,44,38,0.6)" }}
        />
      )}

      {rect && tooltipPos && (
        <div
          className="absolute rounded-2xl bg-ink p-5 text-left text-white shadow-xl"
          style={{ ...tooltipPos, width: TOOLTIP_W }}
        >
          <span
            className="absolute h-3 w-3 rotate-45 bg-ink"
            style={placeBelow ? { top: -6, left: caretLeft } : { bottom: -6, left: caretLeft }}
          />
          <h3 className="font-serif text-lg font-semibold leading-snug">{step.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/80">{step.body}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-medium text-white/60">
              {stepIdx + 1} of {STEPS.length}
            </span>
            <div className="flex items-center gap-3">
              {!isLast && (
                <button
                  type="button"
                  onClick={finish}
                  className="text-xs font-medium text-white/70 hover:text-white"
                >
                  Skip
                </button>
              )}
              <button
                type="button"
                onClick={() => (isLast ? finish() : setStepIdx((i) => i + 1))}
                className="rounded-full bg-cream px-5 py-2 text-sm font-semibold text-ink transition hover:brightness-95"
              >
                {isLast ? "Done" : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
