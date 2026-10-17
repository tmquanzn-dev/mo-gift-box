import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { productInputSchema } from "@/lib/validation";
import { createProduct } from "@/services/product.service";
import { isAdmin } from "@/server/admin-auth";
import { apiError, handleServiceError, parseBody } from "@/server/http";

/** POST /api/admin/products – thêm sản phẩm mới. */
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return apiError("Bạn cần đăng nhập trang quản trị.", 401);
  const { data, error } = await parseBody(req, productInputSchema);
  if (error) return error;
  try {
    const product = await createProduct(data);
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, product });
  } catch (err) {
    return handleServiceError(err);
  }
}
