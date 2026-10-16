import { NextResponse, type NextRequest } from "next/server";
import { changePasswordSchema } from "@/lib/validation";
import { destroyOtherSessions, getCurrentUser } from "@/server/auth";
import { apiError, checkKeyRateLimit, handleServiceError, parseBody } from "@/server/http";
import { changePassword } from "@/services/user.service";

/** POST /api/auth/password – đổi mật khẩu, đăng xuất các thiết bị khác. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Bạn cần đăng nhập.", 401);
  const limited = checkKeyRateLimit(`password:${user.id}`, 5, 15 * 60_000);
  if (limited) return limited;
  const { data, error } = await parseBody(req, changePasswordSchema);
  if (error) return error;
  try {
    await changePassword(user.id, data);
    await destroyOtherSessions(user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleServiceError(err);
  }
}
