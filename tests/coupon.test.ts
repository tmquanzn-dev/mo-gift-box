import { describe, expect, it } from "vitest";
import { evaluateCoupon } from "@/lib/coupon";
import type { Coupon } from "@/types";

const base: Coupon = {
  code: "GIAM15K",
  type: "fixed",
  value: 15_000,
  minOrder: 149_000,
  maxDiscount: null,
  startsAt: "2026-01-01T00:00:00+07:00",
  endsAt: "2026-12-31T23:59:59+07:00",
  usageLimit: 10,
  usedCount: 0,
  description: "",
};
const NOW = new Date("2026-10-15T10:00:00+07:00");

describe("evaluateCoupon", () => {
  it("mã hợp lệ, không phân biệt hoa thường và khoảng trắng", () => {
    const r = evaluateCoupon(base, " giam15k ", 200_000, NOW);
    expect(r).toMatchObject({ ok: true, discount: 15_000 });
  });

  it("báo lỗi mã không tồn tại", () => {
    const r = evaluateCoupon(null, "ABC", 200_000, NOW);
    expect(r).toMatchObject({ ok: false, reason: "not_found" });
  });

  it("báo lỗi mã hết hạn", () => {
    const r = evaluateCoupon(base, "GIAM15K", 200_000, new Date("2027-01-05T00:00:00+07:00"));
    expect(r).toMatchObject({ ok: false, reason: "expired" });
  });

  it("báo lỗi mã chưa bắt đầu", () => {
    const r = evaluateCoupon({ ...base, startsAt: "2026-11-01T00:00:00+07:00" }, "GIAM15K", 200_000, NOW);
    expect(r).toMatchObject({ ok: false, reason: "not_started" });
  });

  it("báo số tiền cần mua thêm khi chưa đạt đơn tối thiểu", () => {
    const r = evaluateCoupon(base, "GIAM15K", 99_000, NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe("min_order");
      expect(r.message).toContain("50.000đ");
    }
  });

  it("báo lỗi hết lượt sử dụng", () => {
    const r = evaluateCoupon({ ...base, usedCount: 10 }, "GIAM15K", 200_000, NOW);
    expect(r).toMatchObject({ ok: false, reason: "usage_exceeded" });
  });

  it("giảm phần trăm có giới hạn mức tối đa", () => {
    const r = evaluateCoupon({ ...base, type: "percent", value: 50, maxDiscount: 30_000 }, "GIAM15K", 200_000, NOW);
    expect(r).toMatchObject({ ok: true, discount: 30_000 });
  });

  it("không giảm quá tiền hàng", () => {
    const r = evaluateCoupon({ ...base, minOrder: 0, value: 100_000 }, "GIAM15K", 59_000, NOW);
    expect(r).toMatchObject({ ok: true, discount: 59_000 });
  });
});
