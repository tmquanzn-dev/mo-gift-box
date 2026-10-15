/** 99000 -> "99.000đ" */
export function formatVND(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? "-" : "";
  const digits = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}${digits}đ`;
}

const WEEKDAYS = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

/** "2026-10-17" -> "Thứ Bảy, 17/10" */
export function formatDayLabel(isoDate: string, withYear = false): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  const base = `${weekday}, ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
  return withYear ? `${base}/${y}` : base;
}

/** "2026-10-17" -> "17/10" */
export function formatShortDate(isoDate: string): string {
  const [, m, d] = isoDate.split("-");
  return `${d}/${m}`;
}

/** Hiển thị khoảng ngày giao: "Thứ Sáu, 16/10 – Thứ Bảy, 17/10" hoặc một ngày nếu trùng. */
export function formatDeliveryRange(range: { from: string; to: string }): string {
  if (range.from === range.to) return formatDayLabel(range.from);
  return `${formatDayLabel(range.from)} – ${formatDayLabel(range.to)}`;
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

/** Ẩn bớt số điện thoại: 0901234567 -> 090****567 */
export function maskPhone(phone: string): string {
  if (phone.length < 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-3)}`;
}
