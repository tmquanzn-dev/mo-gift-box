import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";

/** GET /api/auth/me – header gọi từ trình duyệt để biết ai đang đăng nhập (giữ các trang còn lại tĩnh, tải nhanh). */
export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ ok: true, user }, { headers: { "Cache-Control": "private, no-store" } });
}
