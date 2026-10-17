import "server-only";
import { randomUUID } from "node:crypto";
import type { Prisma, Product as ProductRow, Occasion as OccasionRow, BoxItem as BoxItemRow } from "@prisma/client";
import { businessConfig } from "@/config/site.config";
import { getBudget } from "@/lib/filters";
import { removeDiacritics } from "@/lib/text";
import type { ProductInput } from "@/lib/validation";
import { db } from "@/server/db";
import type { BadgeId, BoxItem, Occasion, Product, ProductFilters } from "@/types";

/* ---------- Mapping từ bản ghi database sang kiểu domain ---------- */

function parseJSON<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function toProduct(row: ProductRow): Product {
  const manualBadges = parseJSON<BadgeId[]>(row.badges, []).filter((b) => b !== "sap-het");
  const isLow = row.stock > 0 && row.stock <= businessConfig.stock.lowStockThreshold;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.shortDescription,
    description: row.description,
    price: row.price,
    compareAtPrice: row.compareAtPrice,
    images: parseJSON(row.images, []),
    occasions: parseJSON(row.occasions, []),
    recipients: parseJSON(row.recipients, []),
    colorThemes: parseJSON(row.colorThemes, []),
    dimensions: { length: row.length, width: row.width, height: row.height },
    contents: parseJSON(row.contents, []),
    isCustomizable: row.isCustomizable,
    stock: row.stock,
    badges: isLow ? [...manualBadges, "sap-het"] : manualBadges,
    rating: row.rating,
    soldCount: row.soldCount,
    createdAt: row.createdAt.toISOString(),
  };
}

function toOccasion(row: OccasionRow): Occasion {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortName: row.shortName,
    description: row.description,
    date: row.month && row.day ? { month: row.month, day: row.day } : null,
    coverImage: row.coverImage,
  };
}

function toBoxItem(row: BoxItemRow): BoxItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    size: row.size,
    stock: row.stock,
    image: row.image,
    category: row.category,
  };
}

/* ---------- Truy vấn sản phẩm ---------- */

/** Mảng JSON lưu dạng chuỗi nên lọc bằng cách tìm '"slug"' trong chuỗi. */
const jsonArrayContainsAny = (field: "occasions" | "recipients" | "colorThemes", values: string[]): Prisma.ProductWhereInput => ({
  OR: values.map((v) => ({ [field]: { contains: `"${v}"` } })),
});

const ORDER_BY: Record<ProductFilters["sort"], Prisma.ProductOrderByWithRelationInput[]> = {
  "moi-nhat": [{ createdAt: "desc" }],
  "ban-chay": [{ soldCount: "desc" }, { createdAt: "desc" }],
  "gia-tang": [{ price: "asc" }, { soldCount: "desc" }],
  "gia-giam": [{ price: "desc" }, { soldCount: "desc" }],
};

export async function listProducts(filters: ProductFilters): Promise<{ items: Product[]; total: number }> {
  const and: Prisma.ProductWhereInput[] = [{ isActive: true }];
  if (filters.occasions.length) and.push(jsonArrayContainsAny("occasions", filters.occasions));
  if (filters.colors.length) and.push(jsonArrayContainsAny("colorThemes", filters.colors));
  if (filters.recipients.length) and.push(jsonArrayContainsAny("recipients", filters.recipients));
  const budget = getBudget(filters.budget);
  if (budget) and.push({ price: { gte: budget.min, ...(budget.max != null ? { lte: budget.max } : {}) } });

  const rows = await db.product.findMany({ where: { AND: and }, orderBy: ORDER_BY[filters.sort] });
  let items = rows.map(toProduct);

  // Tìm kiếm không phân biệt dấu thực hiện ở tầng ứng dụng (SQLite không hỗ trợ bỏ dấu tiếng Việt)
  if (filters.q) {
    const terms = removeDiacritics(filters.q).split(/\s+/).filter(Boolean);
    items = items.filter((p) => {
      const haystack = removeDiacritics(`${p.name} ${p.shortDescription} ${p.contents.map((c) => c.name).join(" ")}`);
      return terms.every((t) => haystack.includes(t));
    });
  }
  return { items, total: items.length };
}

export async function searchProducts(q: string, limit = 6): Promise<Product[]> {
  const { items } = await listProducts({ occasions: [], budget: null, colors: [], recipients: [], sort: "ban-chay", q });
  return items.slice(0, limit);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const row = await db.product.findFirst({ where: { slug, isActive: true } });
  return row ? toProduct(row) : null;
}

export async function listAllProductSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
  return db.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } });
}

export async function getBestSellers(limit = 8): Promise<Product[]> {
  const rows = await db.product.findMany({
    where: { isActive: true, stock: { gt: 0 } },
    orderBy: [{ soldCount: "desc" }],
    take: limit,
  });
  return rows.map(toProduct);
}

/** Sản phẩm liên quan: cùng dịp trước, sau đó cùng tầm giá (±50.000đ). */
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const rows = await db.product.findMany({
    where: {
      isActive: true,
      id: { not: product.id },
      OR: [
        jsonArrayContainsAny("occasions", product.occasions),
        { price: { gte: product.price - 50_000, lte: product.price + 50_000 } },
      ],
    },
    orderBy: [{ soldCount: "desc" }],
  });
  const items = rows.map(toProduct);
  const sameOccasion = items.filter((p) => p.occasions.some((o) => product.occasions.includes(o)));
  const others = items.filter((p) => !sameOccasion.includes(p));
  return [...sameOccasion, ...others].slice(0, limit);
}

/* ---------- Dịp & món lẻ ---------- */

export async function listOccasions(): Promise<Occasion[]> {
  const rows = await db.occasion.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map(toOccasion);
}

export async function listBoxItems(): Promise<BoxItem[]> {
  const rows = await db.boxItem.findMany({ where: { isActive: true }, orderBy: [{ category: "asc" }, { price: "asc" }] });
  return rows.map(toBoxItem);
}

/* ---------- Quản trị sản phẩm ---------- */

export type AdminProduct = Product & { isActive: boolean; manualBadges: BadgeId[]; updatedAt: string };

function toAdminProduct(row: ProductRow): AdminProduct {
  return {
    ...toProduct(row),
    isActive: row.isActive,
    manualBadges: parseJSON<BadgeId[]>(row.badges, []).filter((b) => b !== "sap-het"),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Lỗi nghiệp vụ khi admin sửa sản phẩm (trùng đường dẫn, không tìm thấy…). */
export class ProductError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
    public field?: string,
  ) {
    super(message);
  }
}

/** Admin thấy cả sản phẩm đang ẩn. */
export async function listProductsForAdmin(): Promise<AdminProduct[]> {
  const rows = await db.product.findMany({ orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }] });
  return rows.map(toAdminProduct);
}

export async function getProductForAdmin(id: string): Promise<AdminProduct | null> {
  const row = await db.product.findUnique({ where: { id } });
  return row ? toAdminProduct(row) : null;
}

function toProductData(input: ProductInput) {
  return {
    slug: input.slug,
    name: input.name,
    shortDescription: input.shortDescription,
    description: input.description,
    price: input.price,
    compareAtPrice: input.compareAtPrice,
    images: JSON.stringify(input.images),
    occasions: JSON.stringify(input.occasions),
    recipients: JSON.stringify(input.recipients),
    colorThemes: JSON.stringify(input.colorThemes),
    length: input.dimensions.length,
    width: input.dimensions.width,
    height: input.dimensions.height,
    contents: JSON.stringify(input.contents),
    isCustomizable: input.isCustomizable,
    stock: input.stock,
    badges: JSON.stringify(input.badges),
    isActive: input.isActive,
  };
}

async function assertSlugFree(slug: string, exceptId?: string) {
  const taken = await db.product.findFirst({ where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) }, select: { id: true } });
  if (taken) throw new ProductError("slug_taken", "Đường dẫn này đã có sản phẩm khác dùng, bạn đổi đường dẫn khác nhé.", 409, "slug");
}

export async function createProduct(input: ProductInput): Promise<AdminProduct> {
  await assertSlugFree(input.slug);
  const row = await db.product.create({ data: { id: `p-${randomUUID().slice(0, 8)}`, ...toProductData(input) } });
  return toAdminProduct(row);
}

export async function updateProduct(id: string, input: ProductInput): Promise<AdminProduct> {
  if (!(await db.product.findUnique({ where: { id }, select: { id: true } }))) {
    throw new ProductError("not_found", "Không tìm thấy sản phẩm.", 404);
  }
  await assertSlugFree(input.slug, id);
  const row = await db.product.update({ where: { id }, data: toProductData(input) });
  return toAdminProduct(row);
}

/** Xoá hẳn sản phẩm. Đơn hàng cũ vẫn giữ tên/ảnh/giá đã lưu lúc đặt nên không bị ảnh hưởng. */
export async function deleteProduct(id: string): Promise<void> {
  const res = await db.product.deleteMany({ where: { id } });
  if (res.count === 0) throw new ProductError("not_found", "Không tìm thấy sản phẩm.", 404);
}
