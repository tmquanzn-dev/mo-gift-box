import Link from "next/link";
import { cn } from "@/lib/text";

/** Biểu tượng chiếc nơ nhỏ của thương hiệu. */
export function BowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 14" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 7C9.5 3.5 4.5 1 2.5 2.6 0.8 4 1.6 9.6 3.6 11 5.6 12.3 9.7 9.6 12 7Zm0 0c2.5-3.5 7.5-6 9.5-4.4 1.7 1.4.9 7-1.1 8.4C18.4 12.3 14.3 9.6 12 7Z"
        fill="currentColor"
      />
      <circle cx="12" cy="7" r="1.8" fill="var(--color-bg)" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

/**
 * Logo chữ "mó": serif đậm nâu socola, dấu sắc cách điệu, dòng GIFT BOX giãn chữ kèm nơ.
 * Dựng bằng chữ + SVG để sắc nét ở mọi kích thước. [[Thay bằng file logo chính thức nếu có]]
 */
export function Logo({ size = "md", className, asLink = true }: { size?: "sm" | "md" | "lg"; className?: string; asLink?: boolean }) {
  const scale = size === "sm" ? 0.8 : size === "lg" ? 1.35 : 1;
  const mark = (
    <span className={cn("inline-flex flex-col items-center leading-none text-primary", className)} style={{ fontSize: `${scale}rem` }}>
      <span className="relative font-display text-[2.15em] font-black tracking-tight" aria-hidden="true">
        mo
        <svg viewBox="0 0 10 10" className="absolute -top-[0.06em] right-[0.06em] h-[0.42em] w-[0.42em]" aria-hidden="true">
          <path d="M2.2 8.6 7.6 1.4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </span>
      <span className="-mt-[0.15em] flex items-center gap-[0.3em] text-[0.56em] font-semibold tracking-[0.38em]" aria-hidden="true">
        GIFT BOX
        <BowIcon className="-ml-[0.2em] h-[0.9em] w-[1.5em]" />
      </span>
      <span className="sr-only">MÓ Gift Box</span>
    </span>
  );
  if (!asLink) return mark;
  return (
    <Link href="/" aria-label="MÓ Gift Box – về trang chủ" className="inline-flex rounded-lg">
      {mark}
    </Link>
  );
}
