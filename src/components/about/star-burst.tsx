// Decorative shapes that recur across the Figma marketing pages.

// Six-point sparkle star — sits behind the founder photo and beside the
// highlighted membership card.
export function StarBurst({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" aria-hidden className={className}>
      <path d="M50 0c4 26 20 42 50 50-30 8-46 24-50 50-4-26-20-42-50-50 30-8 46-24 50-50Z" />
    </svg>
  );
}

// Five-petal hand-drawn flower — the pastel silhouettes scattered behind the
// quote band and membership cards.
export function Flower({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" aria-hidden className={className}>
      <path d="M50 6c7 0 12 9 11 20 8-7 18-9 22-3s-1 16-11 21c11 1 20 6 20 13s-9 12-20 13c10 5 15 15 11 21s-14 4-22-3c1 11-4 20-11 20s-12-9-11-20c-8 7-18 9-22 3s1-16 11-21C17 79 8 74 8 67s9-12 20-13C18 49 13 39 17 33s14-4 22 3c-1-11 4-20 11-20Z" />
    </svg>
  );
}
