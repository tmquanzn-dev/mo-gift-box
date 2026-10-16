import { Check } from "lucide-react";
import { cn } from "@/lib/text";

interface StepperProps {
  steps: string[];
  /** Bước hiện tại, bắt đầu từ 1 */
  current: number;
  onStepClick?: (step: number) => void;
  className?: string;
}

/** Thanh các bước – chỉ cho bấm quay lại các bước đã hoàn thành. */
export function Stepper({ steps, current, onStepClick, className }: StepperProps) {
  return (
    <nav aria-label="Tiến trình" className={className}>
      <ol className="flex items-center">
        {steps.map((label, index) => {
          const step = index + 1;
          const done = step < current;
          const active = step === current;
          const clickable = done && onStepClick;
          const content = (
            <>
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-small font-bold transition-colors",
                  done && "border-primary bg-primary text-on-dark",
                  active && "border-primary bg-surface text-primary",
                  !done && !active && "border-border-strong bg-surface text-text-muted",
                )}
              >
                {done ? <Check className="size-4" aria-hidden="true" /> : step}
              </span>
              <span className={cn("text-small font-semibold sm:inline", active ? "text-text" : "text-text-muted", !active && "hidden")}>{label}</span>
            </>
          );
          return (
            <li key={label} className={cn("flex items-center", step < steps.length && "flex-1")}>
              {clickable ? (
                <button type="button" onClick={() => onStepClick(step)} className="flex items-center gap-2 rounded-full pr-2 hover:opacity-80">
                  {content}
                  <span className="sr-only">(đã xong, bấm để sửa)</span>
                </button>
              ) : (
                <span className="flex items-center gap-2 pr-2" aria-current={active ? "step" : undefined}>
                  {content}
                </span>
              )}
              {step < steps.length && <span className={cn("mx-1 h-0.5 flex-1 rounded-full sm:mx-3", done ? "bg-primary" : "bg-border")} aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
