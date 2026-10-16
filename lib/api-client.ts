/** Gọi API nội bộ từ client, luôn trả về kết quả dạng { ok } thay vì ném lỗi. */
export type ApiResult<T> = ({ ok: true } & T) | { ok: false; error: string; code?: string; fieldErrors?: Record<string, string>; status: number; [key: string]: unknown };

export async function postJSON<T = Record<string, unknown>>(url: string, body: unknown, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: init?.method ?? "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      ...init,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      return { ...data, ok: false, error: data.error ?? "MÓ gặp chút trục trặc, bạn thử lại nhé.", status: res.status };
    }
    return { ...data, ok: true };
  } catch {
    return { ok: false, error: "Không kết nối được tới MÓ. Bạn kiểm tra mạng rồi thử lại nhé.", status: 0 };
  }
}
