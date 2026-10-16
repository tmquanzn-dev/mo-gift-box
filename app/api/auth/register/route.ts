import { NextResponse, type NextRequest } from "next/server";
import { registerSchema } from "@/lib/validation";
import { createSession } from "@/server/auth";
import { checkRateLimit, handleServiceError, parseBody } from "@/server/http";
import { registerUser } from "@/services/user.service";

/** POST /api/auth/register – tạo tài khoản khách hàng rồi đăng nhập luôn. */
export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, "register", 5, 10 * 60_000);
  if (limited) return limited;
  const { data, error } = await parseBody(req, registerSchema);
  if (error) return error;
  try {
    const user = await registerUser(data);
    const response = NextResponse.json({ ok: true, user }, { status: 201 });
    response.cookies.set(await createSession(user.id));
    return response;
  } catch (err) {
    return handleServiceError(err);
  }
}
