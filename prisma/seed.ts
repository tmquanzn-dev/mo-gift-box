/**
 * Nạp dữ liệu mẫu từ thư mục data/ vào database.
 * Chạy: npm run db:seed  (an toàn khi chạy lại – dùng upsert, không xoá đơn hàng đã có)
 */
import { PrismaClient } from "@prisma/client";
import occasions from "../data/occasions.json";
import products from "../data/products.json";
import coupons from "../data/coupons.json";
import boxItems from "../data/box-items.json";
import { hashPassword } from "../lib/password";

try {
  process.loadEnvFile(".env");
} catch {
  /* không có .env thì dùng biến môi trường sẵn có */
}

const prisma = new PrismaClient();

async function main() {
  for (const [index, o] of occasions.entries()) {
    const data = {
      slug: o.slug,
      name: o.name,
      shortName: o.shortName,
      description: o.description,
      month: o.date?.month ?? null,
      day: o.date?.day ?? null,
      coverImage: o.coverImage,
      sortOrder: index,
    };
    await prisma.occasion.upsert({ where: { id: o.id }, create: { id: o.id, ...data }, update: data });
  }

  for (const p of products) {
    const data = {
      slug: p.slug,
      name: p.name,
      shortDescription: p.shortDescription,
      description: p.description,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      images: JSON.stringify([`/images/products/${p.slug}-1.svg`, `/images/products/${p.slug}-2.svg`, `/images/products/${p.slug}-3.svg`]),
      occasions: JSON.stringify(p.occasions),
      recipients: JSON.stringify(p.recipients),
      colorThemes: JSON.stringify(p.colorThemes),
      length: p.dimensions.length,
      width: p.dimensions.width,
      height: p.dimensions.height,
      contents: JSON.stringify(p.contents),
      isCustomizable: p.isCustomizable,
      stock: p.stock,
      badges: JSON.stringify(p.badges),
      rating: p.rating,
      soldCount: p.soldCount,
      createdAt: new Date(p.createdAt),
    };
    await prisma.product.upsert({ where: { id: p.id }, create: { id: p.id, ...data }, update: data });
  }

  for (const c of coupons) {
    const data = {
      type: c.type,
      value: c.value,
      minOrder: c.minOrder,
      maxDiscount: c.maxDiscount,
      startsAt: new Date(c.startsAt),
      endsAt: new Date(c.endsAt),
      usageLimit: c.usageLimit,
      description: c.description,
      isFeatured: c.isFeatured,
    };
    // Không ghi đè usedCount khi chạy lại seed
    await prisma.coupon.upsert({ where: { code: c.code }, create: { code: c.code, usedCount: c.usedCount, ...data }, update: data });
  }

  for (const b of boxItems) {
    const { id, ...data } = b;
    await prisma.boxItem.upsert({ where: { id }, create: { id, ...data }, update: data });
  }

  // Tài khoản quản trị từ .env. Đã có thì chỉ đảm bảo quyền admin, không ghi đè mật khẩu đã đổi trên web
  // (muốn đặt lại mật khẩu: npm run admin:create).
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existing) {
      await prisma.user.update({ where: { id: existing.id }, data: { role: "admin" } });
    } else {
      await prisma.user.create({ data: { email: adminEmail, fullName: "Quản trị MÓ", passwordHash: await hashPassword(adminPassword), role: "admin" } });
    }
    console.log(`Tài khoản quản trị: ${adminEmail}`);
  } else {
    console.log("Chưa có ADMIN_EMAIL / ADMIN_PASSWORD trong .env nên chưa tạo tài khoản quản trị.");
  }

  console.log(
    `Đã nạp ${occasions.length} dịp, ${products.length} sản phẩm, ${coupons.length} mã giảm giá, ${boxItems.length} món lẻ.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
