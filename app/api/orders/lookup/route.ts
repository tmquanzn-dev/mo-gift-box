import { NextResponse, type NextRequest } from "next/server";
import { orderLookupSchema } from "@/lib/validation";
import { lookupOrder } from "@/services/order.service";
import { apiError, checkRateLimit, handleServiceError, parseBody } from "@/server/http";
import { buildOrderAccessCookie, readOrderAccess } from "@/server/order-access";

/** POST /api/orders/lookup – tra cứu đơn bằng mã đơn + số điện thoại. */
export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, "lookup", 10);
  if (limited) return limited;
  const { data, error } = await parseBody(req, orderLookupSchema);
  if (error) return error;
  try {
    const order = await lookupOrder(data.code, data.phone);
    if (!order) {
      return apiError("MÓ chưa tìm thấy đơn nào khớp mã đơn và số điện thoại này. Bạn kiểm tra lại giúp MÓ nhé.", 404, {
        code: "not_found",
      });
    }
    const response = NextResponse.json({ ok: true, order });
    // Đã xác minh số điện thoại: cho phép xem trang chi tiết đơn trên trình duyệt này
    response.cookies.set(buildOrderAccessCookie(await readOrderAccess(), order.code));
    return response;
  } catch (err) {
    return handleServiceError(err);
  }
}
