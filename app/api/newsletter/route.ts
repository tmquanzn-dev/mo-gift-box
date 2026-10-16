import { NextResponse, type NextRequest } from "next/server";
import { newsletterSchema } from "@/lib/validation";
import { db } from "@/server/db";
import { checkRateLimit, handleServiceError, parseBody } from "@/server/http";

/** POST /api/newsletter – đăng ký nhận ưu đãi qua email. Đăng ký lại cùng email vẫn báo thành công. */
export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, "newsletter", 5);
  if (limited) return limited;
  const { data, error } = await parseBody(req, newsletterSchema);
  if (error) return error;
  try {
    const email = data.email.toLowerCase();
    await db.subscriber.upsert({ where: { email }, create: { email }, update: {} });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleServiceError(err);
  }
}
