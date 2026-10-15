import { businessConfig } from "@/config/site.config";
import type { Coupon, Customization, ShippingZone, Surcharges } from "@/types";
import { evaluateCoupon, type CouponEvaluation } from "./coupon";

export interface PricingLine {
  unitPrice: number;
  quantity: number;
  customization: Pick<Customization, "handwrittenCard" | "premiumWrap">;
}

export interface PricingInput {
  lines: PricingLine[];
  coupon?: Coupon | null;
  couponCode?: string | null;
  /** null khi khách chưa chọn địa chỉ: phí ship chưa xác định. */
  zone: ShippingZone | null;
  express?: boolean;
  now?: Date;
}

export interface Totals {
  /** Tiền hàng: tổng đơn giá × số lượng. */
  subtotal: number;
  discount: number;
  couponEvaluation: CouponEvaluation | null;
  /** null nếu chưa biết khu vực giao. */
  shippingFee: number | null;
  isFreeShipping: boolean;
  /** Số tiền hàng cần mua thêm để được freeship (0 nếu đã đạt). */
  freeShippingRemaining: number;
  freeShippingProgress: number;
  surcharges: Surcharges;
  surchargeTotal: number;
  total: number;
  itemCount: number;
}

export function lineSurchargePerUnit(customization: PricingLine["customization"]): number {
  const { handwrittenCard, premiumWrap } = businessConfig.surcharges;
  return (customization.handwrittenCard ? handwrittenCard : 0) + (customization.premiumWrap ? premiumWrap : 0);
}

export function shippingFeeForZone(zone: ShippingZone): number {
  return zone === "noi-thanh" ? businessConfig.shipping.innerCityFee : businessConfig.shipping.outerFee;
}

/**
 * Tính toàn bộ tiền của đơn. Client dùng để hiển thị, server dùng lại đúng hàm này
 * với giá lấy từ database, nên số tiền hai bên luôn khớp nhau.
 */
export function computeTotals(input: PricingInput): Totals {
  const { lines, coupon = null, couponCode = null, zone, express = false, now = new Date() } = input;
  const { surcharges: rates, shipping } = businessConfig;

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  const surcharges: Surcharges = {
    handwrittenCard: lines.reduce((s, l) => s + (l.customization.handwrittenCard ? rates.handwrittenCard * l.quantity : 0), 0),
    premiumWrap: lines.reduce((s, l) => s + (l.customization.premiumWrap ? rates.premiumWrap * l.quantity : 0), 0),
    expressDelivery: express && zone === "noi-thanh" && lines.length > 0 ? rates.expressDelivery : 0,
  };
  const surchargeTotal = surcharges.handwrittenCard + surcharges.premiumWrap + surcharges.expressDelivery;

  const couponEvaluation = couponCode ? evaluateCoupon(coupon, couponCode, subtotal, now) : null;
  const discount = couponEvaluation?.ok ? couponEvaluation.discount : 0;

  const merchandiseAfterDiscount = subtotal - discount;
  const isFreeShipping = lines.length > 0 && merchandiseAfterDiscount >= shipping.freeShippingThreshold;
  const freeShippingRemaining = Math.max(0, shipping.freeShippingThreshold - merchandiseAfterDiscount);
  const freeShippingProgress = Math.min(1, Math.max(0, merchandiseAfterDiscount / shipping.freeShippingThreshold));

  let shippingFee: number | null;
  if (lines.length === 0) shippingFee = 0;
  else if (isFreeShipping) shippingFee = 0;
  else shippingFee = zone ? shippingFeeForZone(zone) : null;

  const total = merchandiseAfterDiscount + (shippingFee ?? 0) + surchargeTotal;

  return {
    subtotal,
    discount,
    couponEvaluation,
    shippingFee,
    isFreeShipping,
    freeShippingRemaining,
    freeShippingProgress,
    surcharges,
    surchargeTotal,
    total,
    itemCount,
  };
}
