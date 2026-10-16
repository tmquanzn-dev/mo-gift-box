import { NextResponse, type NextRequest } from "next/server";
import { createOrderSchema } from "@/lib/validation";
import { createOrder } from "@/services/order.service";
import { getCurrentUser } from "@/server/auth";
import { checkRateLimit, handleServiceError, parseBody } from "@/server/http";
import { buildOrderAccessCookie, readOrderAccess } from "@/server/order-access";

/** POST /api/orders – tạo đơn hàng. Server tự tính lại toàn bộ tiền, không tin giá từ client. */
export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, "order", 10);
  if (limited) return limited;
  const { data, error } = await parseBody(req, createOrderSchema);
  if (error) return error;
  try {
    // Đang đăng nhập thì gắn đơn vào tài khoản để xem lại trong lịch sử đơn
    const user = await getCurrentUser();
    const order = await createOrder(data, new Date(), user?.id ?? null);
    const response = NextResponse.json({ ok: true, code: order.code, total: order.total }, { status: 201 });
    response.cookies.set(buildOrderAccessCookie(await readOrderAccess(), order.code));
    return response;
  } catch (err) {
    return handleServiceError(err);
  }
}
