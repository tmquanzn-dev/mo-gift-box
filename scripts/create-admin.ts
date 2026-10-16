/**
 * Tạo hoặc đặt lại tài khoản quản trị.
 *   npm run admin:create -- <email> <mật-khẩu> ["Họ tên"]
 * Không truyền tham số thì lấy ADMIN_EMAIL / ADMIN_PASSWORD trong .env.
 * Email đã tồn tại (kể cả là tài khoản khách) → nâng lên admin và đặt lại mật khẩu.
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";
import { validatePassword } from "../lib/validation";

try {
  process.loadEnvFile(".env");
} catch {
  /* không có .env thì dùng biến môi trường sẵn có */
}

const [emailArg, passwordArg, nameArg] = process.argv.slice(2);
const email = (emailArg ?? process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const password = passwordArg ?? process.env.ADMIN_PASSWORD ?? "";
const fullName = nameArg ?? "Quản trị MÓ";

async function main() {
  if (!email.includes("@")) throw new Error("Thiếu email. Dùng: npm run admin:create -- admin@vidu.vn MatKhau123");
  const problem = validatePassword(password);
  if (problem) throw new Error(problem);

  const prisma = new PrismaClient();
  try {
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.upsert({
      where: { email },
      create: { email, fullName, passwordHash, role: "admin" },
      update: { passwordHash, role: "admin" },
    });
    // Đặt lại mật khẩu thì đăng xuất mọi phiên cũ
    await prisma.session.deleteMany({ where: { userId: user.id } });
    console.log(`Đã sẵn sàng tài khoản quản trị: ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
