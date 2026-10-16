import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";

/** Thông tin người dùng đang đăng nhập – không bao giờ chứa passwordHash. */
export interface SessionUser {
  id: string;
  email: string;
  phone: string | null;
  fullName: string;
  role: "customer" | "admin";
}

export const SESSION_COOKIE = "mo_session";
const SESSION_DAYS = 30;

const hashToken = (token: string) => createHash("sha256").update(token).digest("base64url");

function cookieOptions(maxAge: number) {
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

/** Tạo phiên mới, trả về cookie để route handler gắn vào response. */
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });
  // Dọn phiên hết hạn của người này cho gọn bảng
  await db.session.deleteMany({ where: { userId, expiresAt: { lt: new Date() } } });
  return { ...cookieOptions(SESSION_DAYS * 86_400), value: token };
}

export function clearedSessionCookie() {
  return { ...cookieOptions(0), value: "" };
}

async function readToken(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return token && token.length <= 100 ? token : null;
}

/** Xoá phiên hiện tại (đăng xuất). */
export async function destroyCurrentSession() {
  const token = await readToken();
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

/** Đăng xuất mọi thiết bị khác, giữ lại phiên đang dùng (sau khi đổi mật khẩu). */
export async function destroyOtherSessions(userId: string) {
  const token = await readToken();
  await db.session.deleteMany({ where: { userId, ...(token ? { tokenHash: { not: hashToken(token) } } : {}) } });
}

/** Người dùng của request hiện tại. Bọc cache() để nhiều component gọi trong cùng request chỉ truy vấn một lần. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = await readToken();
  if (!token) return null;
  const session = await db.session.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!session || session.expiresAt < new Date()) return null;
  const { id, email, phone, fullName, role } = session.user;
  return { id, email, phone, fullName, role: role === "admin" ? "admin" : "customer" };
});

export async function requireUser(next: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/dang-nhap?next=${encodeURIComponent(next)}`);
  return user;
}

/** Chỉ cho phép đường dẫn nội bộ để không bị lợi dụng chuyển hướng sang trang lạ. */
export function safeNextPath(next: unknown, fallback = "/tai-khoan"): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}
