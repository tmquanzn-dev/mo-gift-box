import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Ảnh admin tải lên lưu ở thư mục `uploads/` (ngoài `public/`), phục vụ qua route /uploads/[...path].
 * Không để trong `public/` vì bản build production chỉ phục vụ file có sẵn trong `public/` lúc build.
 * Trên Railway/server có ổ đĩa tạm, đặt UPLOAD_DIR trỏ vào volume (ví dụ /data/uploads) để ảnh không mất khi deploy lại.
 */
export const UPLOAD_ROOT = path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), "uploads"));
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const TYPES = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
} as const;
type Ext = keyof typeof TYPES;

/** Nhận diện định dạng qua chữ ký đầu file thay vì tin vào tên/Content-Type do trình duyệt gửi. */
function sniff(buf: Buffer): Ext | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buf.toString("ascii", 0, 4) === "GIF8") return "gif";
  if (buf.toString("ascii", 4, 8) === "ftyp" && ["avif", "avis"].includes(buf.toString("ascii", 8, 12))) return "avif";
  return null;
}

export class UploadError extends Error {}

/** Lưu ảnh vào uploads/<folder>/ và trả về đường dẫn công khai, ví dụ "/uploads/products/ab12….webp". */
export async function saveImage(file: File, folder = "products"): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError(`Ảnh "${file.name}" lớn hơn 5MB.`);
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniff(buf);
  if (!ext) throw new UploadError(`"${file.name}" không phải ảnh JPG, PNG, WEBP, GIF hoặc AVIF.`);
  const dir = path.join(UPLOAD_ROOT, folder);
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, name), buf);
  return `/uploads/${folder}/${name}`;
}

/** Đọc ảnh đã tải lên; trả null nếu đường dẫn không hợp lệ hoặc file không tồn tại. */
export async function readUpload(segments: string[]): Promise<{ data: Buffer; contentType: string } | null> {
  if (!segments.length || segments.some((s) => !/^[A-Za-z0-9_-][A-Za-z0-9._-]*$/.test(s))) return null;
  const ext = path.extname(segments[segments.length - 1]).slice(1) as Ext;
  if (!(ext in TYPES)) return null;
  const file = path.join(UPLOAD_ROOT, ...segments);
  if (!file.startsWith(UPLOAD_ROOT + path.sep)) return null;
  try {
    return { data: await readFile(file), contentType: TYPES[ext] };
  } catch {
    return null;
  }
}
