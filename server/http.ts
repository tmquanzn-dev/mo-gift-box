import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import type { z } from "zod";
import { OrderError } from "@/services/order.service";
import { ProductError } from "@/services/product.service";
import { rateLimit } from "./security";

export type ApiError = { ok: false; error: string; code?: string; fieldErrors?: Record<string, string> };

export function apiError(message: string, status = 400, extra: Omit<ApiError, "ok" | "error"> = {}) {
  return NextResponse.json<ApiError>({ ok: false, error: message, ...extra }, { status });
}

/** Lưu ý: x-forwarded-for khách tự sửa được (trừ khi chạy sau proxy ghi đè nó), nên route nhạy cảm cần thêm checkKeyRateLimit. */
export function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

export function checkRateLimit(req: NextRequest, scope: string, limit: number, windowMs = 60_000) {
  if (!rateLimit(`${scope}:${clientIp(req)}`, limit, windowMs)) {
    return tooFast();
  }
  return null;
}

/** Giới hạn theo một khoá không phụ thuộc IP (ví dụ theo tài khoản) – chặn dò mật khẩu kể cả khi đổi IP liên tục. */
export function checkKeyRateLimit(key: string, limit: number, windowMs = 60_000) {
  if (!rateLimit(key, limit, windowMs)) {
    return tooFast();
  }
  return null;
}

function tooFast() {
  return apiError("Bạn thao tác hơi nhanh rồi, đợi một chút rồi thử lại nhé.", 429);
}

/** Đọc JSON body và kiểm tra bằng Zod. Trả về dữ liệu hoặc response lỗi 400 với lỗi từng trường. */
export async function parseBody<S extends z.ZodType>(
  req: NextRequest,
  schema: S,
): Promise<{ data: z.output<S>; error: null } | { data: null; error: NextResponse }> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return { data: null, error: apiError("Dữ liệu gửi lên không hợp lệ.", 400) };
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    const first = result.error.issues[0]?.message ?? "Dữ liệu chưa hợp lệ.";
    return { data: null, error: apiError(first, 400, { code: "validation", fieldErrors }) };
  }
  return { data: result.data, error: null };
}

export function handleServiceError(error: unknown) {
  if (error instanceof OrderError) return apiError(error.message, error.status, { code: error.code });
  if (error instanceof ProductError) {
    return apiError(error.message, error.status, { code: error.code, ...(error.field ? { fieldErrors: { [error.field]: error.message } } : {}) });
  }
  console.error(error);
  return apiError("MÓ gặp chút trục trặc, bạn thử lại sau ít phút nhé.", 500);
}
