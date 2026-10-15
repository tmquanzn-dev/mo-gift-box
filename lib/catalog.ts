import type { BadgeId, ColorThemeId, OrderStatus, PaymentMethod, PaymentStatus, RecipientId, SortOption } from "@/types";

export const COLOR_THEMES: Record<ColorThemeId, { label: string; swatch: string }> = {
  hong: { label: "Hồng", swatch: "#E8A0B4" },
  do: { label: "Đỏ", swatch: "#C8323C" },
  "xanh-duong": { label: "Xanh dương", swatch: "#5B8DC9" },
  "xanh-la": { label: "Xanh lá", swatch: "#7FA77A" },
  vang: { label: "Vàng", swatch: "#E9C46A" },
  kraft: { label: "Kraft mộc", swatch: "#C8A27A" },
  tim: { label: "Tím", swatch: "#9C82C4" },
};

export const RECIPIENTS: Record<RecipientId, string> = {
  "ban-be": "Bạn bè",
  "thay-co": "Thầy cô",
  "nguoi-yeu": "Người yêu",
  "gia-dinh": "Gia đình",
  "dong-nghiep": "Đồng nghiệp",
};

export const BADGES: Record<BadgeId, { label: string; tone: "primary" | "accent" | "warning" }> = {
  "ban-chay": { label: "Bán chạy", tone: "primary" },
  moi: { label: "Mới", tone: "accent" },
  "sap-het": { label: "Sắp hết", tone: "warning" },
};

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "moi-nhat", label: "Mới nhất" },
  { value: "ban-chay", label: "Bán chạy" },
  { value: "gia-tang", label: "Giá tăng dần" },
  { value: "gia-giam", label: "Giá giảm dần" },
];

export const ORDER_STATUS_FLOW: OrderStatus[] = ["pending", "confirmed", "preparing", "shipping", "delivered"];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Đã đặt",
  confirmed: "Đã xác nhận",
  preparing: "Đang chuẩn bị",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã huỷ",
};

export const ORDER_STATUS_HINTS: Record<OrderStatus, string> = {
  pending: "MÓ đã nhận đơn của bạn.",
  confirmed: "MÓ đã gọi xác nhận và chốt đơn.",
  preparing: "Hộp quà đang được gói bằng tay.",
  shipping: "Shipper đang mang quà đến người nhận.",
  delivered: "Quà đã đến tay người nhận.",
  cancelled: "Đơn hàng đã được huỷ.",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: "Chuyển khoản ngân hàng",
  cod: "Thanh toán khi nhận hàng (COD)",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Chưa thanh toán",
  paid: "Đã thanh toán",
  refunded: "Đã hoàn tiền",
};

export function isColorTheme(value: string): value is ColorThemeId {
  return value in COLOR_THEMES;
}

export function isRecipient(value: string): value is RecipientId {
  return value in RECIPIENTS;
}
