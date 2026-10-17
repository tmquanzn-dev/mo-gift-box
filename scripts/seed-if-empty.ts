/**
 * Nạp dữ liệu mẫu CHỈ khi database còn trống (lần deploy đầu tiên).
 * Không chạy `db:seed` mỗi lần khởi động vì seed dùng upsert sẽ ghi đè sản phẩm admin đã sửa.
 *   npm run db:seed-if-empty
 */
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

try {
  process.loadEnvFile(".env");
} catch {
  /* không có .env thì dùng biến môi trường sẵn có */
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const occasions = await prisma.occasion.count();
    if (occasions > 0) {
      console.log("Database đã có dữ liệu, bỏ qua seed.");
      return;
    }
  } finally {
    await prisma.$disconnect();
  }
  console.log("Database trống – nạp dữ liệu mẫu và tài khoản admin…");
  execSync("npm run db:seed", { stdio: "inherit" });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
