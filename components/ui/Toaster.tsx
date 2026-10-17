"use client";

import { CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { create } from "zustand";
import { cn } from "@/lib/text";

type ToastTone = "success" | "error" | "info";

interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
  action?: { label: string; href: string };
}

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = nextId++;
    set({ toasts: [...get().toasts.slice(-2), { ...toast, id }] });
    setTimeout(() => get().dismiss(id), toast.tone === "error" ? 6000 : 3500);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

type ToastExtra = Partial<Omit<Toast, "id" | "tone" | "title">>;

/** Gọi từ bất kỳ đâu: toast.success("Đã thêm vào giỏ") */
export const toast = {
  success: (title: string, extra?: ToastExtra) => useToastStore.getState().push({ tone: "success", title, ...extra }),
  error: (title: string, extra?: ToastExtra) => useToastStore.getState().push({ tone: "error", title, ...extra }),
  info: (title: string, extra?: ToastExtra) => useToastStore.getState().push({ tone: "info", title, ...extra }),
};

const icons = { success: CircleCheck, error: TriangleAlert, info: Info };

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 top-3 z-[80] flex flex-col items-center gap-2 px-4 sm:top-auto sm:right-6 sm:bottom-6 sm:left-auto sm:items-end"
    >
      {toasts.map((t) => {
        const Icon = icons[t.tone];
        return (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-card border bg-surface p-4 shadow-float",
              t.tone === "success" && "border-success/30",
              t.tone === "error" && "border-error/40",
              t.tone === "info" && "border-border",
            )}
          >
            <Icon
              className={cn("mt-0.5 size-5 shrink-0", t.tone === "success" && "text-success", t.tone === "error" && "text-error", t.tone === "info" && "text-primary")}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-text">{t.title}</p>
              {t.description && <p className="text-small text-text-muted">{t.description}</p>}
              {t.action && (
                <a href={t.action.href} className="mt-1 inline-block text-small font-semibold text-primary underline">
                  {t.action.label}
                </a>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Đóng thông báo"
              data-tooltip="Đóng"
              data-tooltip-side="left"
              className="-m-1 inline-flex size-8 items-center justify-center rounded-full text-text-muted hover:bg-primary-soft"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
