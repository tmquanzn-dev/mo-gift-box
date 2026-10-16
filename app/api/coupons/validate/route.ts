import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { evaluateCoupon } from "@/lib/coupon";
import { findCoupon } from "@/services/coupon.service";
import { apiError, checkRateLimit, handleServiceError, parseBody } from "@/server/http";

const schema = z.object({
  code: z.string().max(32),
  subtotal: z.number().int().min(0).max(100_000_000),
});

/** POST /api/coupons/validate – kiểm tra mã và trả về thông tin mã để client tự tính lại khi giỏ thay đổi. */
export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, "coupon", 20);
  if (limited) return limited;
  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  try {
    const coupon = await findCoupon(data.code);
    const result = evaluateCoupon(coupon, data.code, data.subtotal);
    if (!result.ok) {
      // Mã tồn tại nhưng chưa đủ điều kiện đơn tối thiểu: vẫn trả về mã để client hiển thị gợi ý mua thêm
      if (result.reason === "min_order" && coupon) {
        return NextResponse.json({ ok: false, error: result.message, code: result.reason, coupon }, { status: 422 });
      }
      return apiError(result.message, 422, { code: result.reason });
    }
    return NextResponse.json({ ok: true, coupon: result.coupon, discount: result.discount });
  } catch (err) {
    return handleServiceError(err);
  }
}
