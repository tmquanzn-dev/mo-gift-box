/**
 * Hãng vận chuyển MÓ dùng để giao hàng.
 * trackingUrl: link trang tra cứu của hãng. Có "{code}" thì mã vận đơn được điền sẵn vào link,
 * không có thì mở trang tra cứu và khách dán mã (có nút sao chép mã). Hãng đổi link thì sửa ở đây.
 */
export const CARRIERS = {
  shop: { label: "Shipper của MÓ", shortLabel: "MÓ tự giao", trackingUrl: null },
  ghn: { label: "Giao Hàng Nhanh (GHN)", shortLabel: "GHN", trackingUrl: "https://donhang.ghn.vn/?order_code={code}" },
  ghtk: { label: "Giao Hàng Tiết Kiệm (GHTK)", shortLabel: "GHTK", trackingUrl: "https://i.ghtk.vn/{code}" },
  jt: { label: "J&T Express", shortLabel: "J&T", trackingUrl: "https://jtexpress.vn/vi/tracking" },
  viettelpost: { label: "Viettel Post", shortLabel: "Viettel Post", trackingUrl: "https://viettelpost.com.vn/tra-cuu-hanh-trinh-don/" },
  ahamove: { label: "Ahamove (giao nhanh)", shortLabel: "Ahamove", trackingUrl: null },
  grab: { label: "GrabExpress (giao nhanh)", shortLabel: "GrabExpress", trackingUrl: null },
} as const satisfies Record<string, { label: string; shortLabel: string; trackingUrl: string | null }>;

export type CarrierId = keyof typeof CARRIERS;

export const CARRIER_IDS = Object.keys(CARRIERS) as CarrierId[];

export function isCarrier(value: string | null | undefined): value is CarrierId {
  return !!value && value in CARRIERS;
}

/** Link theo dõi trên trang của hãng; null nếu hãng không có trang tra cứu công khai. */
export function trackingLink(carrier: CarrierId, trackingCode: string | null): string | null {
  const template = CARRIERS[carrier].trackingUrl;
  if (!template) return null;
  if (template.includes("{code}")) return trackingCode ? template.replace("{code}", encodeURIComponent(trackingCode)) : null;
  return template;
}

/** true khi link đã chứa sẵn mã vận đơn (không cần khách dán mã). */
export function trackingLinkHasCode(carrier: CarrierId): boolean {
  return CARRIERS[carrier].trackingUrl?.includes("{code}") ?? false;
}
