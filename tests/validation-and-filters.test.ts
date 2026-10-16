import { describe, expect, it } from "vitest";
import { filtersToSearchParams, parseFilters } from "@/lib/filters";
import { normalizeMessage, removeDiacritics } from "@/lib/text";
import { checkoutFormSchema, customizationSchema, validateFullName, validatePhone } from "@/lib/validation";
import { resolveZone } from "@/services/address.service";

describe("validate", () => {
  it("số điện thoại Việt Nam 10 số bắt đầu bằng 0", () => {
    expect(validatePhone("0901234567")).toBeNull();
    expect(validatePhone("090 123 4567")).toBeNull();
    expect(validatePhone("+84901234567")).toBeNull();
    expect(validatePhone("901234567")).not.toBeNull();
    expect(validatePhone("09012345678")).not.toBeNull();
    expect(validatePhone("")).not.toBeNull();
  });

  it("họ tên tiếng Việt có dấu hợp lệ, không chứa số/ký tự đặc biệt", () => {
    expect(validateFullName("Nguyễn Thị Ánh Dương")).toBeNull();
    expect(validateFullName("An@123")).not.toBeNull();
    expect(validateFullName("A")).not.toBeNull();
  });

  it("lời chúc được lọc khoảng trắng thừa trước khi đếm ký tự", () => {
    expect(normalizeMessage("  Chúc   mừng \n\n\n\n sinh nhật  ")).toBe("Chúc mừng\n\nsinh nhật");
    const long = `${"a".repeat(150)}      `;
    expect(customizationSchema.safeParse({ recipientName: "", message: long, cardTemplateId: null, handwrittenCard: false, premiumWrap: false }).success).toBe(true);
    expect(
      customizationSchema.safeParse({ recipientName: "", message: "a".repeat(151), cardTemplateId: null, handwrittenCard: false, premiumWrap: false }).success,
    ).toBe(false);
  });

  it("bắt buộc thông tin người nhận khi chọn người nhận khác người đặt", () => {
    const base = {
      customer: { fullName: "Trần Minh", phone: "0901234567", email: "" },
      recipientIsDifferent: true,
      recipient: { fullName: "", phone: "" },
      address: { provinceId: "ho-chi-minh", wardId: "hcm-ben-thanh", wardName: "", street: "12 Lê Lợi", note: "" },
      preferredDate: "",
      hidePrice: false,
      express: false,
      paymentMethod: "cod" as const,
    };
    const result = checkoutFormSchema.safeParse(base);
    expect(result.success).toBe(false);
    const paths = result.success ? [] : result.error.issues.map((i) => i.path.join("."));
    expect(paths).toContain("recipient.fullName");
    expect(paths).toContain("recipient.phone");
    expect(checkoutFormSchema.safeParse({ ...base, recipientIsDifferent: false }).success).toBe(true);
  });
});

describe("khu vực giao hàng", () => {
  it("phường nội thành của tỉnh shop là nội thành", () => {
    expect(resolveZone("ho-chi-minh", "hcm-ben-thanh")).toBe("noi-thanh");
    expect(resolveZone("ho-chi-minh", "hcm-cu-chi")).toBe("ngoai-thanh");
    expect(resolveZone("ha-noi", "hn-hoan-kiem")).toBe("ngoai-thanh");
    expect(resolveZone("", "")).toBeNull();
  });
});

describe("bộ lọc URL", () => {
  it("đọc và ghi lại URL giống nhau (link chia sẻ được)", () => {
    const params = new URLSearchParams("dip=20-10,valentine&gia=99k&mau=hong&nguoi-nhan=nguoi-yeu&sap-xep=gia-tang");
    const filters = parseFilters(params);
    expect(filters).toMatchObject({ occasions: ["20-10", "valentine"], budget: "99k", colors: ["hong"], recipients: ["nguoi-yeu"], sort: "gia-tang" });
    expect(parseFilters(filtersToSearchParams(filters))).toEqual(filters);
  });

  it("bỏ qua giá trị không hợp lệ", () => {
    const filters = parseFilters({ gia: "1-trieu", mau: "cam", "sap-xep": "abc" });
    expect(filters.budget).toBeNull();
    expect(filters.colors).toEqual([]);
    expect(filters.sort).toBe("ban-chay");
  });

  it("tìm kiếm không dấu", () => {
    expect(removeDiacritics("Hộp Quà Đêm Đông")).toBe("hop qua dem dong");
  });
});
