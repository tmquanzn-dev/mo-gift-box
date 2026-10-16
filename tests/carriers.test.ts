import { describe, expect, it } from "vitest";
import { trackingLink } from "@/lib/carriers";
import { shipmentSchema } from "@/lib/validation";

describe("vận chuyển", () => {
  it("điền mã vận đơn vào link của hãng", () => {
    expect(trackingLink("ghn", "GHN123ABC")).toBe("https://donhang.ghn.vn/?order_code=GHN123ABC");
    expect(trackingLink("ghn", null)).toBeNull();
    expect(trackingLink("jt", "8123")).toBe("https://jtexpress.vn/vi/tracking");
    expect(trackingLink("shop", null)).toBeNull();
  });

  it("hãng có mã vận đơn thì bắt buộc nhập mã; shipper của shop thì không", () => {
    const base = { trackingCode: "", shipperName: "", shipperPhone: "" };
    expect(shipmentSchema.safeParse({ ...base, carrier: "ghn" }).success).toBe(false);
    expect(shipmentSchema.safeParse({ ...base, carrier: "ghn", trackingCode: "GHN123" }).success).toBe(true);
    expect(shipmentSchema.safeParse({ ...base, carrier: "shop", shipperName: "Minh", shipperPhone: "0901234567" }).success).toBe(true);
    expect(shipmentSchema.safeParse({ ...base, carrier: "shop", shipperPhone: "123" }).success).toBe(false);
    expect(shipmentSchema.safeParse({ ...base, carrier: "ghn", trackingCode: "<script>" }).success).toBe(false);
  });
});
