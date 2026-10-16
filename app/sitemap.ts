import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site.config";
import { POLICIES } from "@/data/policies";
import { listAllProductSlugs, listOccasions } from "@/services/product.service";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, "");
  const [products, occasions] = await Promise.all([listAllProductSlugs(), listOccasions()]);
  const now = new Date();
  const staticPages = ["", "/cua-hang", "/tu-thiet-ke", "/tra-cuu-don-hang", "/huong-dan-mua-hang", "/lien-he"].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));
  return [
    ...staticPages,
    ...occasions.map((o) => ({ url: `${base}/cua-hang?dip=${o.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${base}/san-pham/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.9 })),
    ...POLICIES.map((p) => ({ url: `${base}/chinh-sach/${p.slug}`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.3 })),
  ];
}
