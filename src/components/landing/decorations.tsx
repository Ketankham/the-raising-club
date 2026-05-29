/* Pastel decorative shapes used throughout the landing page (matches Figma). */

export function Flower({ className = "", color = "#FFD7E4" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} fill="none" aria-hidden="true">
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse
          key={deg}
          cx="40"
          cy="22"
          rx="13"
          ry="20"
          fill={color}
          transform={`rotate(${deg} 40 40)`}
        />
      ))}
      <circle cx="40" cy="40" r="11" fill="#FBE7A1" />
    </svg>
  );
}

export function Leaf({ className = "", color = "#C0CF72" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 60 80" className={className} fill="none" aria-hidden="true">
      <path
        d="M30 2C8 18 4 50 28 78 52 50 52 18 30 2Z"
        fill={color}
      />
      <path d="M30 14V70" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="2" />
    </svg>
  );
}

export function Blob({ className = "", color = "#F1AE6E" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" aria-hidden="true">
      <path
        d="M59 6c20-3 41 9 51 28s7 44-9 60-44 22-64 11S6 70 9 48 39 9 59 6Z"
        fill={color}
      />
    </svg>
  );
}
