import "server-only";
import type { Coupon as CouponRow } from "@prisma/client";
import { normalizeCouponCode } from "@/lib/coupon";
import { db } from "@/server/db";
import type { Coupon } from "@/types";

export function toCoupon(row: CouponRow): Coupon {
  return {
    code: row.code,
    type: row.type === "percent" ? "percent" : "fixed",
    value: row.value,
    minOrder: row.minOrder,
    maxDiscount: row.maxDiscount,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    usageLimit: row.usageLimit,
    usedCount: row.usedCount,
    description: row.description,
  };
}

export async function findCoupon(code: string): Promise<Coupon | null> {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return null;
  const row = await db.coupon.findFirst({ where: { code: normalized, isActive: true } });
  return row ? toCoupon(row) : null;
}

/** Mã đang chạy được làm nổi bật trên banner trang chủ. */
export async function getFeaturedCoupon(now: Date = new Date()): Promise<Coupon | null> {
  const row = await db.coupon.findFirst({
    where: { isActive: true, isFeatured: true, startsAt: { lte: now }, endsAt: { gte: now } },
    orderBy: { endsAt: "asc" },
  });
  if (!row || row.usedCount >= row.usageLimit) return null;
  return toCoupon(row);
}
