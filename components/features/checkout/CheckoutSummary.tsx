"use client";

import Image from "next/image";
import { ChevronDown, Clock } from "lucide-react";
import { useState } from "react";
import { COLOR_THEMES } from "@/lib/catalog";
import { formatDeliveryRange, formatVND } from "@/lib/format";
import type { Totals } from "@/lib/pricing";
import { cn } from "@/lib/text";
import { useCartStore } from "@/store/cart.store";
import { CouponInput } from "../cart/CouponInput";
import { FreeShipProgress, OrderTotals } from "../cart/OrderTotals";
import { BoxContentsSummary, CustomizationSummary } from "../order/CustomizationSummary";

function SummaryBody({ totals, delivery }: { totals: Totals; delivery: { from: string; to: string } | null }) {
  const items = useCartStore((s) => s.items);
  const couponCode = useCartStore((s) => s.couponCode);
  return (
    <div className="flex flex-col gap-5">
      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <li key={item.lineId} className="flex gap-3">
            <span className="relative size-16 shrink-0 overflow-hidden rounded-box bg-surface-sunken">
              <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
              <span className="absolute -top-0 -right-0 flex size-6 items-center justify-center rounded-bl-box bg-primary text-caption font-bold text-on-dark">{item.quantity}</span>
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-2">
                <p className="line-clamp-2 text-small font-semibold">{item.name}</p>
                <p className="text-small font-semibold tabular-nums">{formatVND(item.unitPrice * item.quantity)}</p>
              </div>
              <p className="text-caption text-text-muted">Màu {COLOR_THEMES[item.colorTheme]?.label}</p>
              <BoxContentsSummary box={item.box} />
              <CustomizationSummary customization={item.customization} className="mt-1" />
            </div>
          </li>
        ))}
      </ul>
      <CouponInput />
      <FreeShipProgress totals={totals} />
      <OrderTotals totals={totals} couponCode={couponCode} />
      {delivery && (
        <p className="flex items-start gap-2 rounded-box bg-primary-soft/70 p-3 text-small">
          <Clock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>
            Giao dự kiến: <strong>{formatDeliveryRange(delivery)}</strong>
          </span>
        </p>
      )}
    </div>
  );
}

/** Desktop: cột phải cố định khi cuộn. Mobile: thu gọn ở đầu trang, bấm để mở. */
export function CheckoutSummary({ totals, delivery }: { totals: Totals; delivery: { from: string; to: string } | null }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="rounded-card bg-surface shadow-soft lg:hidden">
        <button type="button" aria-expanded={open} aria-controls="mobile-summary" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 p-4">
          <span className="flex items-center gap-2 text-small font-semibold text-primary">
            {open ? "Ẩn tóm tắt đơn hàng" : "Xem tóm tắt đơn hàng"}
            <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
          </span>
          <span className="text-h3 font-bold tabular-nums">{formatVND(totals.total)}</span>
        </button>
        {open && (
          <div id="mobile-summary" className="border-t border-border p-4">
            <SummaryBody totals={totals} delivery={delivery} />
          </div>
        )}
      </div>
      <aside aria-label="Tóm tắt đơn hàng" className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
        <div className="max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-card bg-surface p-5 shadow-soft">
          <h2 className="mb-4 font-display text-h3 font-bold">Đơn hàng của bạn</h2>
          <SummaryBody totals={totals} delivery={delivery} />
        </div>
      </aside>
    </>
  );
}
