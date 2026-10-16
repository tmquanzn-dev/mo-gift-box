import { describe, expect, it } from "vitest";
import { businessConfig } from "@/config/site.config";
import { computeTotals } from "@/lib/pricing";
import type { Coupon } from "@/types";

const plain = { handwrittenCard: false, premiumWrap: false };
const NOW = new Date("2026-10-15T10:00:00+07:00");

const percentCoupon: Coupon = {
  code: "MOYEU20",
  type: "percent",
  value: 20,
  minOrder: 199_000,
  maxDiscount: 40_000,
  startsAt: "2026-10-01T00:00:00+07:00",
  endsAt: "2026-12-31T23:59:59+07:00",
  usageLimit: 200,
  usedCount: 0,
  description: "",
};

describe("computeTotals", () => {
  it("tính tạm tính và phí ship nội thành", () => {
    const t = computeTotals({ lines: [{ unitPrice: 99_000, quantity: 2, customization: plain }], zone: "noi-thanh", now: NOW });
    expect(t.subtotal).toBe(198_000);
    expect(t.shippingFee).toBe(businessConfig.shipping.innerCityFee);
    expect(t.total).toBe(198_000 + businessConfig.shipping.innerCityFee);
    expect(t.freeShippingRemaining).toBe(299_000 - 198_000);
  });

  it("chưa có địa chỉ thì phí ship là null và không cộng vào tổng", () => {
    const t = computeTotals({ lines: [{ unitPrice: 59_000, quantity: 1, customization: plain }], zone: null, now: NOW });
    expect(t.shippingFee).toBeNull();
    expect(t.total).toBe(59_000);
  });

  it("miễn phí ship khi tiền hàng sau giảm giá đạt mốc", () => {
    // 2 × 149.000 = 298.000đ: còn thiếu 1.000đ nên chưa được freeship
    const almost = computeTotals({ lines: [{ unitPrice: 149_000, quantity: 2, customization: plain }], zone: "ngoai-thanh", now: NOW });
    expect(almost.isFreeShipping).toBe(false);
    expect(almost.freeShippingRemaining).toBe(1_000);
    // Thêm 1 hộp 59.000đ → 357.000đ: đạt mốc
    const t = computeTotals({
      lines: [
        { unitPrice: 149_000, quantity: 2, customization: plain },
        { unitPrice: 59_000, quantity: 1, customization: plain },
      ],
      zone: "ngoai-thanh",
      now: NOW,
    });
    expect(t.isFreeShipping).toBe(true);
    expect(t.shippingFee).toBe(0);
  });

  it("giảm giá làm tiền hàng tụt dưới mốc thì mất freeship", () => {
    const t = computeTotals({
      lines: [{ unitPrice: 299_000, quantity: 1, customization: plain }],
      coupon: percentCoupon,
      couponCode: "MOYEU20",
      zone: "ngoai-thanh",
      now: NOW,
    });
    expect(t.discount).toBe(40_000); // 20% = 59.800 nhưng tối đa 40.000
    expect(t.isFreeShipping).toBe(false);
    expect(t.shippingFee).toBe(businessConfig.shipping.outerFee);
    expect(t.total).toBe(299_000 - 40_000 + businessConfig.shipping.outerFee);
  });

  it("phụ phí thiệp viết tay và gói cao cấp tính theo từng hộp", () => {
    const t = computeTotals({ lines: [{ unitPrice: 99_000, quantity: 3, customization: { handwrittenCard: true, premiumWrap: true } }], zone: "noi-thanh", now: NOW });
    expect(t.surcharges.handwrittenCard).toBe(3 * businessConfig.surcharges.handwrittenCard);
    expect(t.surcharges.premiumWrap).toBe(3 * businessConfig.surcharges.premiumWrap);
    expect(t.total).toBe(297_000 + t.surchargeTotal + businessConfig.shipping.innerCityFee);
  });

  it("giao nhanh chỉ áp dụng cho nội thành và tính một lần", () => {
    const inner = computeTotals({ lines: [{ unitPrice: 99_000, quantity: 2, customization: plain }], zone: "noi-thanh", express: true, now: NOW });
    const outer = computeTotals({ lines: [{ unitPrice: 99_000, quantity: 2, customization: plain }], zone: "ngoai-thanh", express: true, now: NOW });
    expect(inner.surcharges.expressDelivery).toBe(businessConfig.surcharges.expressDelivery);
    expect(outer.surcharges.expressDelivery).toBe(0);
  });

  it("mã chưa đạt đơn tối thiểu thì không giảm", () => {
    const t = computeTotals({ lines: [{ unitPrice: 99_000, quantity: 1, customization: plain }], coupon: percentCoupon, couponCode: "MOYEU20", zone: "noi-thanh", now: NOW });
    expect(t.discount).toBe(0);
    expect(t.couponEvaluation?.ok).toBe(false);
  });

  it("giỏ trống thì tổng bằng 0", () => {
    const t = computeTotals({ lines: [], zone: "noi-thanh", express: true, now: NOW });
    expect(t.total).toBe(0);
  });
});
