import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/server/admin-auth";
import { apiError } from "@/server/http";
import { saveImage, UploadError } from "@/server/uploads";

const MAX_FILES = 10;

/** POST /api/admin/uploads – multipart, trường "files" (nhiều ảnh). Trả về { urls }. */
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return apiError("Bạn cần đăng nhập trang quản trị.", 401);
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return apiError("Dữ liệu tải lên không hợp lệ.");
  }
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return apiError("Bạn chọn ít nhất 1 ảnh nhé.");
  if (files.length > MAX_FILES) return apiError(`Mỗi lần tải tối đa ${MAX_FILES} ảnh.`);
  try {
    const urls: string[] = [];
    for (const file of files) urls.push(await saveImage(file));
    return NextResponse.json({ ok: true, urls });
  } catch (err) {
    if (err instanceof UploadError) return apiError(err.message);
    console.error(err);
    return apiError("Không lưu được ảnh, bạn thử lại nhé.", 500);
  }
}
