"use client";

import { TicketPercent, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Form";
import { postJSON } from "@/lib/api-client";
import { normalizeCouponCode } from "@/lib/coupon";
import { formatVND } from "@/lib/format";
import { useCartStore } from "@/store/cart.store";
import { useCartTotals } from "@/store/use-cart-totals";
import type { Coupon } from "@/types";

export function CouponInput() {
  const couponCode = useCartStore((s) => s.couponCode);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);
  const totals = useCartTotals();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const normalized = normalizeCouponCode(code);
    if (!normalized) {
      setError("Bạn nhập mã giảm giá giúp MÓ nhé.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await postJSON<{ coupon: Coupon; discount: number }>("/api/coupons/validate", { code: normalized, subtotal: totals.subtotal });
    setLoading(false);
    if (res.ok) {
      applyCoupon(res.coupon);
      setCode("");
    } else {
      setError(res.error);
    }
  };

  if (couponCode) {
    const evaluation = totals.couponEvaluation;
    const applied = evaluation?.ok;
    return (
      <div className={applied ? "rounded-box bg-success-bg p-3" : "rounded-box bg-warning-bg p-3"}>
        <div className="flex items-center justify-between gap-2">
          <p className={applied ? "flex items-center gap-2 font-semibold text-success" : "flex items-center gap-2 font-semibold text-warning"}>
            <TicketPercent className="size-5" aria-hidden="true" />
            {couponCode}
            {applied && <span className="font-normal">· -{formatVND(totals.discount)}</span>}
          </p>
          <button
            type="button"
            onClick={removeCoupon}
            aria-label={`Bỏ mã ${couponCode}`}
            data-tooltip="Bỏ mã giảm giá"
            data-tooltip-side="left"
            className="inline-flex size-8 items-center justify-center rounded-full text-text-muted hover:bg-surface"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        {evaluation && !evaluation.ok && (
          <p role="status" className="mt-1 text-small text-warning">
            {evaluation.message}
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-1.5">
      <label htmlFor="coupon-code" className="text-small font-semibold text-text">
        Mã giảm giá
      </label>
      <div className="flex gap-2">
        <Input
          id="coupon-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          placeholder="Nhập mã, ví dụ MOYEU20"
          autoCapitalize="characters"
          autoComplete="off"
          invalid={Boolean(error)}
          aria-describedby={error ? "coupon-error" : undefined}
          className="h-11 uppercase"
        />
        <Button type="submit" variant="outline" loading={loading} className="h-11 shrink-0">
          Áp dụng
        </Button>
      </div>
      {error && (
        <p id="coupon-error" role="alert" className="text-small font-medium text-error">
          {error}
        </p>
      )}
    </form>
  );
}
