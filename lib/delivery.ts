import { businessConfig } from "@/config/site.config";
import type { ShippingZone } from "@/types";

export interface VNClock {
  /** Ngày hiện tại theo giờ Việt Nam, dạng YYYY-MM-DD */
  date: string;
  hour: number;
}

/** Lấy ngày giờ hiện tại theo múi giờ Việt Nam, bất kể server chạy ở múi giờ nào. */
export function getVNClock(now: Date = new Date()): VNClock {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: businessConfig.delivery.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) };
}

export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function diffDays(fromIso: string, toIso: string): number {
  const toUtc = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(toIso) - toUtc(fromIso)) / 86_400_000);
}

export interface DeliveryEstimate {
  from: string;
  to: string;
  /** true nếu đơn đặt sau giờ chốt và được tính sang ngày hôm sau. */
  afterCutoff: boolean;
}

/**
 * Ước tính ngày giao.
 * - Đơn đặt từ giờ chốt (mặc định 17:00) trở đi được tính từ ngày hôm sau.
 * - Giao nhanh (chỉ nội thành): giao ngay trong ngày bắt đầu tính.
 */
export function estimateDelivery(zone: ShippingZone | null, express = false, now: Date = new Date()): DeliveryEstimate {
  const { cutoffHour, innerCityDays, otherDays } = businessConfig.delivery;
  const clock = getVNClock(now);
  const afterCutoff = clock.hour >= cutoffHour;
  const start = afterCutoff ? addDays(clock.date, 1) : clock.date;

  if (express && zone === "noi-thanh") {
    return { from: start, to: start, afterCutoff };
  }
  const range = zone === "noi-thanh" ? innerCityDays : otherDays;
  return { from: addDays(start, range.min), to: addDays(start, range.max), afterCutoff };
}

/** Ngày sớm nhất khách được chọn làm "ngày giao mong muốn". */
export function earliestPreferredDate(zone: ShippingZone | null, express = false, now: Date = new Date()): string {
  return estimateDelivery(zone, express, now).from;
}

export function latestPreferredDate(now: Date = new Date()): string {
  return addDays(getVNClock(now).date, businessConfig.delivery.maxPreferredDays);
}

/** Mô tả ngắn thời gian giao cho trang sản phẩm. */
export function deliveryPolicyText(): { inner: string; outer: string; cutoff: string } {
  const { innerCityDays, otherDays, cutoffHour } = businessConfig.delivery;
  return {
    inner: `${innerCityDays.min}–${innerCityDays.max} ngày`,
    outer: `${otherDays.min}–${otherDays.max} ngày`,
    cutoff: `${cutoffHour}:00`,
  };
}
