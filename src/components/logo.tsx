import Image from "next/image";

/** The Raising Club brand mark (official asset). */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="The Raising Club"
      width={424}
      height={94}
      priority
      className={`h-9 w-auto ${className}`}
    />
  );
}
