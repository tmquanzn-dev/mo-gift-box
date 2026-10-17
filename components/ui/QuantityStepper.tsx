"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/text";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  label?: string;
  className?: string;
}

export function QuantityStepper({ value, onChange, min = 1, max = 99, size = "md", label = "Số lượng", className }: QuantityStepperProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, Number.isFinite(n) ? Math.round(n) : min));
  const btn = cn(
    "inline-flex items-center justify-center rounded-full text-primary transition-colors hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-40",
    size === "md" ? "size-11" : "size-9",
  );
  return (
    <div role="group" aria-label={label} className={cn("inline-flex items-center rounded-full border-[1.5px] border-border-strong bg-surface", className)}>
      <button type="button" className={btn} onClick={() => onChange(clamp(value - 1))} disabled={value <= min} aria-label="Giảm số lượng" data-tooltip="Bớt 1">
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label={label}
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        className={cn("w-10 bg-transparent text-center font-semibold tabular-nums focus:outline-none", size === "sm" && "text-small")}
      />
      <button type="button" className={btn} onClick={() => onChange(clamp(value + 1))} disabled={value >= max} aria-label="Tăng số lượng" data-tooltip="Thêm 1">
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
