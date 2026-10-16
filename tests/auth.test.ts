import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";
import { changePasswordSchema, loginSchema, registerSchema, validatePassword } from "@/lib/validation";

describe("mật khẩu", () => {
  it("băm có muối và kiểm tra đúng", async () => {
    const a = await hashPassword("QuaTang2026");
    const b = await hashPassword("QuaTang2026");
    expect(a).not.toBe(b);
    expect(a.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("QuaTang2026", a)).toBe(true);
    expect(await verifyPassword("quatang2026", a)).toBe(false);
    expect(await verifyPassword("QuaTang2026", "chuoi-sai-dinh-dang")).toBe(false);
  });

  it("quy tắc độ mạnh", () => {
    expect(validatePassword("abc12345")).toBeNull();
    expect(validatePassword("abc1234")).not.toBeNull();
    expect(validatePassword("abcdefgh")).not.toBeNull();
    expect(validatePassword("12345678")).not.toBeNull();
  });
});

describe("form tài khoản", () => {
  const base = { fullName: "Nguyễn Văn An", email: "  An@Gmail.COM ", phone: "0901234567", password: "matkhau123", confirmPassword: "matkhau123" };

  it("đăng ký hợp lệ, email chuẩn hoá chữ thường", () => {
    const r = registerSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("an@gmail.com");
  });

  it("từ chối mật khẩu nhập lại không khớp và SĐT sai", () => {
    expect(registerSchema.safeParse({ ...base, confirmPassword: "khac12345" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, phone: "12345" }).success).toBe(false);
  });

  it("đăng nhập cần đủ hai ô", () => {
    expect(loginSchema.safeParse({ identifier: "0901234567", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ identifier: " ", password: "x" }).success).toBe(false);
  });

  it("mật khẩu mới phải khác mật khẩu cũ", () => {
    expect(changePasswordSchema.safeParse({ currentPassword: "matkhau123", newPassword: "matkhau123", confirmPassword: "matkhau123" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ currentPassword: "matkhau123", newPassword: "moi12345", confirmPassword: "moi12345" }).success).toBe(true);
  });
});
