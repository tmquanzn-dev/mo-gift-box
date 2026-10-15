import type { Coupon } from "@/types";
import { formatVND } from "./format";

export type CouponErrorReason = "empty" | "not_found" | "not_started" | "expired" | "min_order" | "usage_exceeded";

export type CouponEvaluation =
  | { ok: true; discount: number; coupon: Coupon }
  | { ok: false; reason: CouponErrorReason; message: string };

export function normalizeCouponCode(code: string): string {
  return code.replace(/\s+/g, "").toUpperCase();
}

/**
 * Kiểm tra mã giảm giá và tính số tiền được giảm trên tiền hàng.
 * Mã chỉ trừ vào tiền hàng, không trừ phí vận chuyển và phụ phí.
 */
export function evaluateCoupon(
  coupon: Coupon | null,
  inputCode: string,
  merchandiseSubtotal: number,
  now: Date = new Date(),
): CouponEvaluation {
  const code = normalizeCouponCode(inputCode);
  if (!code) {
    return { ok: false, reason: "empty", message: "Bạn nhập mã giảm giá giúp MÓ nhé." };
  }
  if (!coupon || normalizeCouponCode(coupon.code) !== code) {
    return {
      ok: false,
      reason: "not_found",
      message: `Mã "${code}" không tồn tại. Bạn kiểm tra lại chính tả giúp MÓ nhé.`,
    };
  }
  if (now < new Date(coupon.startsAt)) {
    return {
      ok: false,
      reason: "not_started",
      message: `Mã ${code} chưa đến thời gian áp dụng. Bạn quay lại sau nhé.`,
    };
  }
  if (now > new Date(coupon.endsAt)) {
    return { ok: false, reason: "expired", message: `Mã ${code} đã hết hạn mất rồi.` };
  }
  if (coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, reason: "usage_exceeded", message: `Mã ${code} đã hết lượt sử dụng.` };
  }
  if (merchandiseSubtotal < coupon.minOrder) {
    const missing = coupon.minOrder - merchandiseSubtotal;
    return {
      ok: false,
      reason: "min_order",
      message: `Mã ${code} áp dụng cho đơn từ ${formatVND(coupon.minOrder)}. Bạn mua thêm ${formatVND(missing)} nữa nhé.`,
    };
  }

  let discount = coupon.type === "percent" ? Math.round((merchandiseSubtotal * coupon.value) / 100) : coupon.value;
  if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.max(0, Math.min(discount, merchandiseSubtotal));

  return { ok: true, discount, coupon };
}

/** Mô tả ngắn điều kiện của mã, dùng cho banner ưu đãi. */
export function describeCoupon(coupon: Coupon): string {
  const value = coupon.type === "percent" ? `Giảm ${coupon.value}%` : `Giảm ${formatVND(coupon.value)}`;
  const cap = coupon.type === "percent" && coupon.maxDiscount ? `, tối đa ${formatVND(coupon.maxDiscount)}` : "";
  const min = coupon.minOrder > 0 ? ` cho đơn từ ${formatVND(coupon.minOrder)}` : " cho mọi đơn";
  return `${value}${cap}${min}`;
}
