/** Bỏ dấu tiếng Việt để tìm kiếm không phân biệt dấu: "Hộp quà" -> "hop qua" */
export function removeDiacritics(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

/** Tạo đường dẫn từ tên: "Hộp quà 20/10 Hồng" -> "hop-qua-20-10-hong" */
export function slugify(input: string): string {
  return removeDiacritics(input)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/** Gom khoảng trắng thừa trong lời chúc, giữ tối đa một dòng trống giữa các đoạn. */
export function normalizeMessage(input: string): string {
  return input
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t ]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Gom khoảng trắng trong tên: "  nguyễn   văn a " -> "nguyễn văn a" */
export function normalizeName(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

/** Bỏ khoảng trắng, dấu chấm, gạch nối khỏi số điện thoại người dùng gõ vào. */
export function normalizePhone(input: string): string {
  return input.replace(/[\s.\-()]/g, "").replace(/^\+84/, "0");
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
