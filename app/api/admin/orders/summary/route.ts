import { NextResponse } from "next/server";
import { getPendingSummary } from "@/services/order.service";
import { isAdmin } from "@/server/admin-auth";
import { apiError } from "@/server/http";

export const dynamic = "force-dynamic";

/** GET /api/admin/orders/summary – số đơn chờ xác nhận + đơn mới nhất, trang admin hỏi định kỳ để báo đơn mới. */
export async function GET() {
  if (!(await isAdmin())) return apiError("Bạn cần đăng nhập trang quản trị.", 401);
  return NextResponse.json({ ok: true, ...(await getPendingSummary()) });
}
