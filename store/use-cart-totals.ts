"use client";

import { useMemo } from "react";
import { computeTotals } from "@/lib/pricing";
import type { ShippingZone } from "@/types";
import { useCartStore } from "./cart.store";

/** Tính tổng tiền giỏ hàng theo thời gian thực – dùng chung cho drawer, trang giỏ và checkout. */
export function useCartTotals(zone: ShippingZone | null = null, express = false) {
  const items = useCartStore((s) => s.items);
  const coupon = useCartStore((s) => s.coupon);
  const couponCode = useCartStore((s) => s.couponCode);
  return useMemo(
    () =>
      computeTotals({
        lines: items.map((i) => ({ unitPrice: i.unitPrice, quantity: i.quantity, customization: i.customization })),
        coupon,
        couponCode,
        zone,
        express,
      }),
    [items, coupon, couponCode, zone, express],
  );
}
