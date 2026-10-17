import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser, type SessionUser } from "./auth";

/** Quản trị viên là tài khoản có role = "admin" (tạo bằng `npm run db:seed` từ ADMIN_EMAIL / ADMIN_PASSWORD). */
export async function isAdmin(): Promise<boolean> {
  return (await getCurrentUser())?.role === "admin";
}

export async function requireAdmin(next = "/admin"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/dang-nhap?next=${encodeURIComponent(next)}`);
  if (user.role !== "admin") redirect("/tai-khoan?loi=khong-co-quyen");
  return user;
}
