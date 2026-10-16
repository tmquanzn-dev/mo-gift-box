import { NextResponse, type NextRequest } from "next/server";
import { normalizeName, normalizePhone } from "@/lib/text";
import { contactSchema } from "@/lib/validation";
import { db } from "@/server/db";
import { checkRateLimit, handleServiceError, parseBody } from "@/server/http";

/** POST /api/contact – lưu lời nhắn từ trang Liên hệ. */
export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, "contact", 5);
  if (limited) return limited;
  const { data, error } = await parseBody(req, contactSchema);
  if (error) return error;
  try {
    await db.contactMessage.create({
      data: {
        fullName: normalizeName(data.fullName),
        phone: normalizePhone(data.phone),
        email: data.email || null,
        message: data.message,
      },
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return handleServiceError(err);
  }
}
