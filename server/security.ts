import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const DEV_SECRET = "mo-gift-box-dev-secret-change-me";

function getSecret(): string {
  const secret = process.env.APP_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("Thiếu biến môi trường APP_SECRET.");
  }
  return secret || DEV_SECRET;
}

function hmac(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

/** Ký một chuỗi: "giá-trị.chữ-ký" */
export function sign(value: string): string {
  return `${value}.${hmac(value)}`;
}

/** Trả về giá trị gốc nếu chữ ký hợp lệ, ngược lại null. */
export function unsign(signed: string | undefined | null): string | null {
  if (!signed) return null;
  const index = signed.lastIndexOf(".");
  if (index <= 0) return null;
  const value = signed.slice(0, index);
  const expected = Buffer.from(hmac(value));
  const actual = Buffer.from(signed.slice(index + 1));
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  return value;
}

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/* ---------- Giới hạn tần suất (bộ nhớ trong – đủ cho một server; dùng Redis khi chạy nhiều instance) ---------- */

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 5000) {
      for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
    }
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}
