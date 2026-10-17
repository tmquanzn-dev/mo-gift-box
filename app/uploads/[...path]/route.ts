import type { NextRequest } from "next/server";
import { readUpload } from "@/server/uploads";

/** GET /uploads/... – phục vụ ảnh admin đã tải lên. Tên file là UUID ngẫu nhiên nên cache vĩnh viễn được. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const file = await readUpload((await params).path);
  if (!file) return new Response("Không tìm thấy ảnh", { status: 404 });
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
