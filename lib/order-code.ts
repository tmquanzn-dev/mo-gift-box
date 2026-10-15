import { businessConfig } from "@/config/site.config";
import { getVNClock } from "./delivery";

/** MO + yyMMdd (giờ Việt Nam) + 4 số ngẫu nhiên. Ví dụ: MO2610140123 */
export function generateOrderCode(now: Date = new Date(), random: () => number = Math.random): string {
  const [yyyy, mm, dd] = getVNClock(now).date.split("-");
  const suffix = Math.floor(random() * 10_000)
    .toString()
    .padStart(4, "0");
  return `${businessConfig.order.codePrefix}${yyyy.slice(2)}${mm}${dd}${suffix}`;
}

export const ORDER_CODE_PATTERN = /^MO\d{10}$/;

export function normalizeOrderCode(input: string): string {
  return input.replace(/\s+/g, "").toUpperCase();
}
