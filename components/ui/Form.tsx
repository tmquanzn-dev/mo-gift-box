"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/text";

const control =
  "w-full rounded-box border-[1.5px] border-border-strong bg-surface px-4 text-body text-text placeholder:text-text-muted/80 " +
  "transition-[border-color,box-shadow] duration-150 hover:border-primary " +
  "focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 " +
  "disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:opacity-70 " +
  "aria-invalid:border-error aria-invalid:focus:ring-error/15";

interface FieldProps {
  label: string;
  /** Hiển thị "(không bắt buộc)" cạnh nhãn */
  optional?: boolean;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
  /** Phần tử hiển thị bên phải nhãn, ví dụ bộ đếm ký tự */
  aside?: ReactNode;
}

/** Bọc nhãn + ô nhập + gợi ý + lỗi, tự gắn aria-describedby và aria-invalid. */
export function Field({ label, optional, required, hint, error, className, children, aside }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-small font-semibold text-text">
          {label}
          {required && (
            <span className="text-error" aria-hidden="true">
              {" "}
              *
            </span>
          )}
          {optional && <span className="font-normal text-text-muted"> (không bắt buộc)</span>}
        </label>
        {aside}
      </div>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="text-caption text-text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-small font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; leftIcon?: ReactNode };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, invalid, leftIcon, ...props }, ref) {
  return (
    <div className="relative">
      {leftIcon && <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-muted">{leftIcon}</span>}
      <input ref={ref} aria-invalid={invalid || undefined} className={cn(control, "h-12", Boolean(leftIcon) && "pl-11", className)} {...props} />
    </div>
  );
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean; placeholder?: string };

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ className, invalid, placeholder, children, ...props }, ref) {
  return (
    <div className="relative">
      <select ref={ref} aria-invalid={invalid || undefined} className={cn(control, "h-12 appearance-none pr-10", className)} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-5 -translate-y-1/2 text-text-muted" aria-hidden="true" />
    </div>
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ className, invalid, ...props }, ref) {
  return <textarea ref={ref} aria-invalid={invalid || undefined} className={cn(control, "min-h-28 resize-y py-3", className)} {...props} />;
});

/** Bộ đếm ký tự cho Textarea, đổi màu khi gần chạm giới hạn. */
export function CharCounter({ current, max }: { current: number; max: number }) {
  const ratio = current / max;
  return (
    <span
      aria-live="polite"
      className={cn("text-caption tabular-nums", ratio > 1 ? "font-semibold text-error" : ratio > 0.9 ? "text-warning" : "text-text-muted")}
    >
      {current}/{max}
    </span>
  );
}

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: ReactNode; description?: ReactNode };

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ label, description, className, id, ...props }, ref) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label htmlFor={inputId} className={cn("flex cursor-pointer items-start gap-3", className)}>
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        className="mt-0.5 size-5 shrink-0 cursor-pointer rounded-md border-border-strong accent-primary"
        {...props}
      />
      <span className="flex flex-col">
        <span className="text-body text-text">{label}</span>
        {description && <span className="text-small text-text-muted">{description}</span>}
      </span>
    </label>
  );
});

type RadioCardProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  aside?: ReactNode;
};

/** Ô chọn dạng thẻ lớn, dễ bấm trên điện thoại. */
export const RadioCard = forwardRef<HTMLInputElement, RadioCardProps>(function RadioCard({ label, description, icon, aside, className, ...props }, ref) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-card border-2 border-border bg-surface p-4 transition-colors",
        "hover:border-secondary has-[:checked]:border-primary has-[:checked]:bg-primary-soft/60 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-primary/20",
        className,
      )}
    >
      <input ref={ref} type="radio" className="mt-1 size-5 shrink-0 accent-primary" {...props} />
      {icon && <span className="mt-0.5 text-primary">{icon}</span>}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-semibold text-text">{label}</span>
        {description && <span className="text-small text-text-muted">{description}</span>}
      </span>
      {aside}
    </label>
  );
});
