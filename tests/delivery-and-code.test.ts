import { describe, expect, it } from "vitest";
import { estimateDelivery, getVNClock } from "@/lib/delivery";
import { formatDayLabel, formatVND } from "@/lib/format";
import { generateOrderCode, ORDER_CODE_PATTERN } from "@/lib/order-code";

describe("estimateDelivery", () => {
  it("dùng giờ Việt Nam bất kể múi giờ server", () => {
    // 23:30 UTC ngày 14 = 06:30 sáng ngày 15 ở Việt Nam
    expect(getVNClock(new Date("2026-10-14T23:30:00Z"))).toEqual({ date: "2026-10-15", hour: 6 });
  });

  it("nội thành trước 17:00: 1–2 ngày", () => {
    expect(estimateDelivery("noi-thanh", false, new Date("2026-10-15T10:00:00+07:00"))).toMatchObject({ from: "2026-10-16", to: "2026-10-17", afterCutoff: false });
  });

  it("đặt từ 17:00 trở đi được tính sang ngày hôm sau", () => {
    expect(estimateDelivery("noi-thanh", false, new Date("2026-10-15T17:00:00+07:00"))).toMatchObject({ from: "2026-10-17", to: "2026-10-18", afterCutoff: true });
  });

  it("tỉnh khác: 3–5 ngày, qua tháng mới vẫn đúng", () => {
    expect(estimateDelivery("ngoai-thanh", false, new Date("2026-10-30T09:00:00+07:00"))).toMatchObject({ from: "2026-11-02", to: "2026-11-04" });
  });

  it("giao nhanh nội thành: trong ngày", () => {
    expect(estimateDelivery("noi-thanh", true, new Date("2026-10-15T09:00:00+07:00"))).toMatchObject({ from: "2026-10-15", to: "2026-10-15" });
  });
});

describe("generateOrderCode", () => {
  it("đúng định dạng MO + yyMMdd + 4 số", () => {
    const code = generateOrderCode(new Date("2026-10-14T08:00:00+07:00"), () => 0.0123);
    expect(code).toBe("MO2610140123");
    expect(ORDER_CODE_PATTERN.test(code)).toBe(true);
  });

  it("lấy ngày theo giờ Việt Nam", () => {
    expect(generateOrderCode(new Date("2026-10-14T18:00:00Z"), () => 0).slice(0, 8)).toBe("MO261015");
  });
});

describe("định dạng", () => {
  it("tiền VNĐ dạng 99.000đ", () => {
    expect(formatVND(99_000)).toBe("99.000đ");
    expect(formatVND(1_234_500)).toBe("1.234.500đ");
    expect(formatVND(0)).toBe("0đ");
  });
  it("ngày kèm thứ", () => {
    expect(formatDayLabel("2026-10-20")).toBe("Thứ Ba, 20/10");
  });
});
