"use client";

import { X } from "lucide-react";
import { useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useBodyScrollLock, useFocusTrap, useIsClient } from "@/lib/hooks";
import { cn } from "@/lib/text";
import { IconButton } from "./Button";

interface BaseOverlayProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Ẩn tiêu đề khỏi giao diện nhưng vẫn đọc được bằng trình đọc màn hình */
  hideTitle?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

function useOverlay(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open, onClose);
  useBodyScrollLock(open);
  return panelRef;
}

/** Hộp thoại giữa màn hình. Trên mobile tự trượt lên từ đáy. */
export function Modal({ open, onClose, title, hideTitle, children, footer, className }: BaseOverlayProps) {
  const isClient = useIsClient();
  const panelRef = useOverlay(open, onClose);
  const titleId = useId();
  if (!isClient || !open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-text/45 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[92dvh] w-full animate-slide-in-up flex-col overflow-hidden rounded-t-card bg-surface shadow-float sm:max-w-lg sm:animate-toast-in sm:rounded-card",
          className,
        )}
      >
        <div className={cn("flex items-center justify-between gap-4 px-5 pt-4", hideTitle ? "absolute top-0 right-0 z-10" : "border-b border-border pb-3")}>
          <h2 id={titleId} className={cn("font-display text-h3 font-semibold", hideTitle && "sr-only")}>
            {title}
          </h2>
          <IconButton aria-label="Đóng" onClick={onClose} variant={hideTitle ? "surface" : "ghost"}>
            <X className="size-5" aria-hidden="true" />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-border bg-surface px-5 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/** Ngăn kéo trượt từ cạnh màn hình: giỏ hàng (phải), menu mobile (trái), bộ lọc (đáy). */
export function Drawer({ open, onClose, title, hideTitle, children, footer, className, side = "right" }: BaseOverlayProps & { side?: "left" | "right" | "bottom" }) {
  const isClient = useIsClient();
  const panelRef = useOverlay(open, onClose);
  const titleId = useId();
  if (!isClient || !open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 animate-fade-in bg-text/45 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "absolute flex flex-col bg-surface shadow-float",
          side === "right" && "inset-y-0 right-0 w-full max-w-md animate-slide-in-right",
          side === "left" && "inset-y-0 left-0 w-[86%] max-w-sm animate-slide-in-left",
          side === "bottom" && "inset-x-0 bottom-0 max-h-[88dvh] animate-slide-in-up rounded-t-card",
          className,
        )}
      >
        {side === "bottom" && <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-border" aria-hidden="true" />}
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
          <h2 id={titleId} className={cn("font-display text-h3 font-semibold", hideTitle && "sr-only")}>
            {title}
          </h2>
          <IconButton aria-label="Đóng" onClick={onClose}>
            <X className="size-5" aria-hidden="true" />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="border-t border-border bg-surface px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
