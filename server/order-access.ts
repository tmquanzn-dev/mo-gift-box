import "server-only";
import { cookies } from "next/headers";
import { sign, unsign } from "./security";

/**
 * Cookie ký HMAC ghi nhớ các mã đơn trình duyệt này vừa đặt.
 * Nhờ vậy trang /dat-hang-thanh-cong/[ma-don] chỉ hiện chi tiết cho đúng người đặt;
 * người khác cầm link phải nhập số điện thoại ở trang tra cứu.
 */
const COOKIE = "mo_orders";
const MAX_CODES = 10;

export async function readOrderAccess(): Promise<string[]> {
  const store = await cookies();
  const value = unsign(store.get(COOKIE)?.value);
  return value ? value.split(",").filter(Boolean) : [];
}

export async function hasOrderAccess(code: string): Promise<boolean> {
  return (await readOrderAccess()).includes(code);
}

export function buildOrderAccessCookie(existing: string[], code: string) {
  const codes = [code, ...existing.filter((c) => c !== code)].slice(0, MAX_CODES);
  return {
    name: COOKIE,
    value: sign(codes.join(",")),
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  };
}
