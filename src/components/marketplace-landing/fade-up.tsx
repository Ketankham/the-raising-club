"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Scroll-reveal wrapper for the marketplace landing page. Fades + lifts its
 * children into place the first time they enter the viewport, mirroring the
 * `.fade-up` IntersectionObserver effect from the reference design.
 */
export function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  /** stagger delay in ms (matches the d1..d5 ramp in the reference) */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setVisible(true);
          io.unobserve(el);
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "translate-y-7 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
