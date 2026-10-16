import { NextResponse, type NextRequest } from "next/server";
import { profileSchema } from "@/lib/validation";
import { getCurrentUser } from "@/server/auth";
import { apiError, handleServiceError, parseBody } from "@/server/http";
import { updateProfile } from "@/services/user.service";

/** PATCH /api/auth/profile – sửa họ tên, số điện thoại. */
export async function PATCH(req: NextRequest) {
  const current = await getCurrentUser();
  if (!current) return apiError("Bạn cần đăng nhập.", 401);
  const { data, error } = await parseBody(req, profileSchema);
  if (error) return error;
  try {
    const user = await updateProfile(current.id, data);
    return NextResponse.json({ ok: true, user });
  } catch (err) {
    return handleServiceError(err);
  }
}
