import type { Occasion } from "@/types";
import { diffDays, getVNClock } from "./delivery";

/** Ngày diễn ra gần nhất (từ hôm nay trở đi) của một dịp lặp lại hằng năm, dạng YYYY-MM-DD. */
export function nextOccurrence(occasion: Occasion, now: Date = new Date()): string | null {
  if (!occasion.date) return null;
  const today = getVNClock(now).date;
  const year = Number(today.slice(0, 4));
  const pad = (n: number) => String(n).padStart(2, "0");
  const candidate = `${year}-${pad(occasion.date.month)}-${pad(occasion.date.day)}`;
  return diffDays(today, candidate) >= 0 ? candidate : `${year + 1}-${pad(occasion.date.month)}-${pad(occasion.date.day)}`;
}

/** Dịp cố định sắp tới gần nhất – được làm nổi bật trên trang chủ kèm đếm ngược. */
export function upcomingOccasion(occasions: Occasion[], now: Date = new Date()): { occasion: Occasion; date: string; daysLeft: number } | null {
  const today = getVNClock(now).date;
  let best: { occasion: Occasion; date: string; daysLeft: number } | null = null;
  for (const occasion of occasions) {
    const date = nextOccurrence(occasion, now);
    if (!date) continue;
    const daysLeft = diffDays(today, date);
    if (!best || daysLeft < best.daysLeft) best = { occasion, date, daysLeft };
  }
  return best;
}
