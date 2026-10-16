"use client";

import { MessageCircle, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { siteConfig } from "@/config/site.config";
import { cn } from "@/lib/text";

/**
 * Nút chat nổi góc phải dưới. Trang nào có thanh mua hàng cố định ở đáy sẽ đặt biến
 * --bottom-bar-h trên <html>, nút tự nhấc lên để không che nút mua.
 * Ẩn ở trang thanh toán để không che ô nhập liệu (và khách tập trung đặt hàng).
 */
export function FloatingChat() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  if (pathname.startsWith("/thanh-toan")) return null;
  return (
    <div
      className="fixed right-4 z-30 flex flex-col items-end gap-2 transition-[bottom] duration-300 md:right-6"
      style={{ bottom: "calc(16px + var(--bottom-bar-h, 0px) + env(safe-area-inset-bottom))" }}
    >
      {open && (
        <ul className="flex animate-toast-in flex-col gap-2" aria-label="Kênh chat với MÓ">
          <li>
            <a
              href={siteConfig.contact.zalo}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center gap-2 rounded-full bg-[#0068FF] px-4 text-small font-semibold text-white shadow-lift hover:brightness-110"
            >
              Chat Zalo
              <span className="sr-only"> (mở tab mới)</span>
            </a>
          </li>
          <li>
            <a
              href={siteConfig.contact.messenger}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center gap-2 rounded-full bg-[#0866FF] px-4 text-small font-semibold text-white shadow-lift hover:brightness-110"
            >
              Messenger
              <span className="sr-only"> (mở tab mới)</span>
            </a>
          </li>
        </ul>
      )}
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? "Đóng khung chat" : "Chat với MÓ qua Zalo hoặc Messenger"}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex size-11 items-center md:size-13 justify-center rounded-full shadow-float transition-colors",
          open ? "bg-surface text-primary" : "bg-primary text-on-dark hover:bg-primary-hover",
        )}
      >
        {open ? <X className="size-5 md:size-6" aria-hidden="true" /> : <MessageCircle className="size-5 md:size-6" aria-hidden="true" />}
      </button>
    </div>
  );
}
