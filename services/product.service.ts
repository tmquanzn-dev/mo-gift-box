import "server-only";
import type { Prisma, Product as ProductRow, Occasion as OccasionRow, BoxItem as BoxItemRow } from "@prisma/client";
import { businessConfig } from "@/config/site.config";
import { getBudget } from "@/lib/filters";
import { removeDiacritics } from "@/lib/text";
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
