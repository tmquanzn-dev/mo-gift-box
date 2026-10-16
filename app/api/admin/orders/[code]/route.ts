import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { shipmentSchema } from "@/lib/validation";
import { updateOrderStatus, updatePaymentStatus, updateShipment } from "@/services/order.service";
import { isAdmin } from "@/server/admin-auth";
import { apiError, handleServiceError, parseBody } from "@/server/http";

const schema = z
  .object({
    status: z.enum(["pending", "confirmed", "preparing", "shipping", "delivered", "cancelled"]).optional(),
    note: z.string().max(200).optional(),
    paymentStatus: z.enum(["unpaid", "paid", "refunded"]).optional(),
    shipment: shipmentSchema.optional(),
  })
  .refine((v) => v.status || v.paymentStatus || v.shipment, { message: "Không có thay đổi nào." });

/** PATCH /api/admin/orders/:code – cập nhật trạng thái đơn, trạng thái thanh toán hoặc thông tin vận chuyển. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  if (!(await isAdmin())) return apiError("Bạn cần đăng nhập trang quản trị.", 401);
  const { code } = await params;
  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  try {
    let order = null;
    if (data.shipment) order = await updateShipment(code, data.shipment);
    if (data.status) order = await updateOrderStatus(code, data.status, data.note);
    if (data.paymentStatus) order = await updatePaymentStatus(code, data.paymentStatus);
    return NextResponse.json({ ok: true, order });
  } catch (err) {
    return handleServiceError(err);
  }
}
