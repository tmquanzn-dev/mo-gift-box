import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { productInputSchema } from "@/lib/validation";
import { deleteProduct, updateProduct } from "@/services/product.service";
import { isAdmin } from "@/server/admin-auth";
import { apiError, handleServiceError, parseBody } from "@/server/http";

type Ctx = { params: Promise<{ id: string }> };

/** PUT /api/admin/products/:id – cập nhật toàn bộ thông tin sản phẩm. */
export async function PUT(req: NextRequest, { params }: Ctx) {
  if (!(await isAdmin())) return apiError("Bạn cần đăng nhập trang quản trị.", 401);
  const { id } = await params;
  const { data, error } = await parseBody(req, productInputSchema);
  if (error) return error;
  try {
    const product = await updateProduct(id, data);
    // Trang chủ, cửa hàng, trang sản phẩm đều có thể đang cache dữ liệu cũ
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, product });
  } catch (err) {
    return handleServiceError(err);
  }
}

/** DELETE /api/admin/products/:id – xoá hẳn sản phẩm. */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  if (!(await isAdmin())) return apiError("Bạn cần đăng nhập trang quản trị.", 401);
  try {
    await deleteProduct((await params).id);
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleServiceError(err);
  }
}
