import { NextResponse, type NextRequest } from "next/server";
import { loginSchema } from "@/lib/validation";
import { createSession } from "@/server/auth";
import { apiError, checkKeyRateLimit, checkRateLimit, handleServiceError, parseBody } from "@/server/http";
import { authenticate } from "@/services/user.service";

/** POST /api/auth/login – đăng nhập bằng email hoặc số điện thoại (khách hàng và quản trị viên dùng chung). */
export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, "login", 10, 5 * 60_000);
  if (limited) return limited;
  const { data, error } = await parseBody(req, loginSchema);
  if (error) return error;
  // Giới hạn theo tài khoản: đổi IP (sửa header) cũng không dò được mật khẩu
  const perAccount = checkKeyRateLimit(`login-account:${data.identifier.toLowerCase()}`, 5, 15 * 60_000);
  if (perAccount) return perAccount;
  try {
    const user = await authenticate(data.identifier, data.password);
    if (!user) return apiError("Email/số điện thoại hoặc mật khẩu chưa đúng.", 401);
    const response = NextResponse.json({ ok: true, user });
    response.cookies.set(await createSession(user.id));
    return response;
  } catch (err) {
    return handleServiceError(err);
  }
}
