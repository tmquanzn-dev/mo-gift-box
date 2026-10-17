import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/text";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap select-none " +
  "transition-[background-color,color,box-shadow,transform] duration-200 ease-out active:scale-[0.98] " +
  "disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100 aria-disabled:cursor-not-allowed aria-disabled:opacity-55";

const variants: Record<ButtonVariant, string> = {
  // Màu accent chỉ dành cho hành động chính
  primary: "bg-accent-strong text-white shadow-soft hover:bg-accent-hover hover:shadow-lift",
  secondary: "bg-primary text-on-dark shadow-soft hover:bg-primary-hover",
  outline: "border-2 border-primary text-primary bg-transparent hover:bg-primary-soft",
  ghost: "text-primary bg-transparent hover:bg-primary-soft",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-small",
  md: "h-11 px-6 text-body",
  lg: "h-14 px-8 text-body",
};

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, loadingText, leftIcon, rightIcon, fullWidth, className, children, disabled, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses(variant, size, cn(fullWidth && "w-full", className))}
      {...props}
    >
      {loading ? <Spinner className="size-4" /> : leftIcon}
      <span>{loading && loadingText ? loadingText : children}</span>
      {!loading && rightIcon}
    </button>
  );
});

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export function ButtonLink({ variant = "primary", size = "md", leftIcon, rightIcon, fullWidth, className, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, cn(fullWidth && "w-full", className))} {...props}>
      {leftIcon}
      <span>{children}</span>
      {rightIcon}
    </Link>
  );
}

export type TooltipSide = "top" | "bottom" | "left" | "right";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Bắt buộc: mô tả cho trình đọc màn hình */
  "aria-label": string;
  variant?: "ghost" | "surface" | "primary";
  size?: "sm" | "md";
  /** Chú thích hiện khi rê chuột. Mặc định dùng aria-label; truyền false để tắt. */
  tooltip?: string | false;
  tooltipSide?: TooltipSide;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = "ghost", size = "md", className, type = "button", tooltip, tooltipSide, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      data-tooltip={tooltip === false ? undefined : (tooltip ?? props["aria-label"])}
      data-tooltip-side={tooltipSide}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full transition-colors duration-200 disabled:opacity-50",
        size === "md" ? "size-11" : "size-9",
        variant === "ghost" && "text-primary hover:bg-primary-soft",
        variant === "surface" && "bg-surface text-primary shadow-soft hover:bg-primary-soft",
        variant === "primary" && "bg-primary text-on-dark hover:bg-primary-hover",
        className,
      )}
      {...props}
    />
  );
});
