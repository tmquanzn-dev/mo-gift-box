import Link from "next/link";
import { ChevronRight, X } from "lucide-react";
import type { ReactNode } from "react";
import { formatVND } from "@/lib/format";
import { cn } from "@/lib/text";

/* ---------- Badge ---------- */

export type BadgeTone = "primary" | "accent" | "warning" | "success" | "neutral" | "error";

const badgeTones: Record<BadgeTone, string> = {
  primary: "bg-primary text-on-dark",
  accent: "bg-accent-strong text-white",
  warning: "bg-warning-bg text-warning",
  success: "bg-success-bg text-success",
  error: "bg-error-bg text-error",
  neutral: "bg-surface-sunken text-text",
};

export function Badge({ tone = "neutral", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-caption font-semibold tracking-wide", badgeTones[tone], className)}>
      {children}
    </span>
  );
}

/* ---------- PriceTag ---------- */

export function PriceTag({
  price,
  compareAtPrice,
  size = "md",
  className,
}: {
  price: number;
  compareAtPrice?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const onSale = compareAtPrice != null && compareAtPrice > price;
  const percent = onSale ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span
        className={cn(
          "font-bold tabular-nums",
          onSale ? "text-accent-strong" : "text-text",
          size === "sm" && "text-body",
          size === "md" && "text-h3",
          size === "lg" && "text-h2 font-sans",
        )}
      >
        {formatVND(price)}
        {onSale && <span className="sr-only">, giá khuyến mãi</span>}
      </span>
      {onSale && (
        <>
          <s className={cn("text-text-muted tabular-nums", size === "sm" ? "text-caption" : "text-small")}>
            <span className="sr-only">Giá gốc </span>
            {formatVND(compareAtPrice)}
          </s>
          {size !== "sm" && <Badge tone="error">-{percent}%</Badge>}
        </>
      )}
    </div>
  );
}

/* ---------- Breadcrumb ---------- */

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Đường dẫn" className="text-small text-text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {item.href && !last ? (
                <Link href={item.href} className="rounded hover:text-primary hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={cn(last && "font-medium text-text", "line-clamp-1")}>
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ---------- Skeleton ---------- */

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("skeleton rounded-box", className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-card bg-surface p-3" aria-hidden="true">
      <Skeleton className="aspect-square w-full rounded-[16px]" />
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="h-4 w-2/5" />
    </div>
  );
}

/* ---------- EmptyState ---------- */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-card bg-surface px-6 py-12 text-center", className)}>
      {icon && <div className="flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary">{icon}</div>}
      <h2 className="font-display text-h3 font-semibold text-text">{title}</h2>
      {description && <div className="max-w-md text-body text-text-muted">{description}</div>}
      {action && <div className="mt-2 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

/* ---------- ProgressBar ---------- */

export function ProgressBar({ value, label, className }: { value: number; label: string; className?: string }) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-sunken", className)}
    >
      <div className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out" style={{ width: `${percent}%` }} />
    </div>
  );
}

/* ---------- Chip ---------- */

export function Chip({ children, onRemove, removeLabel }: { children: ReactNode; onRemove?: () => void; removeLabel?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-secondary bg-surface py-1 pr-1 pl-3 text-small font-medium text-text">
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel ?? "Xoá"}
          className="inline-flex size-7 items-center justify-center rounded-full text-text-muted hover:bg-primary-soft hover:text-primary"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </span>
  );
}

/* ---------- Section heading ---------- */

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  id,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  align?: "left" | "center";
  id?: string;
}) {
  return (
    <div className={cn("mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between", align === "center" && "items-center text-center md:flex-col md:items-center")}>
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && <p className="mb-2 text-caption font-semibold tracking-[0.18em] text-primary uppercase">{eyebrow}</p>}
        <h2 id={id} className="text-h2 font-bold text-text">
          {title}
        </h2>
        {description && <p className="mt-2 text-body text-text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
