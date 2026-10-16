import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CircleCheck, Ruler } from "lucide-react";
import { DeliveryInfo } from "@/components/features/product/DeliveryInfo";
import { ProductCard } from "@/components/features/product/ProductCard";
import { ProductGallery } from "@/components/features/product/ProductGallery";
import { ProductPurchasePanel } from "@/components/features/product/ProductPurchasePanel";
import { Badge, Breadcrumb, PriceTag } from "@/components/ui/Display";
import { siteConfig } from "@/config/site.config";
import { BADGES, COLOR_THEMES } from "@/lib/catalog";
import { getProductBySlug, getRelatedProducts, listAllProductSlugs, listOccasions } from "@/services/product.service";

export const revalidate = 300;

export async function generateStaticParams() {
  const slugs = await listAllProductSlugs();
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/san-pham/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Không tìm thấy hộp quà" };
  return {
    title: product.name,
    description: product.shortDescription,
    alternates: { canonical: `/san-pham/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.name,
      description: product.shortDescription,
      url: `/san-pham/${product.slug}`,
      images: [{ url: product.images[0], alt: product.name }],
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/san-pham/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, occasions] = await Promise.all([getRelatedProducts(product, 4), listOccasions()]);
  const primaryOccasion = occasions.find((o) => o.slug === product.occasions[0]);
  const { length, width, height } = product.dimensions;

  // Dữ liệu có cấu trúc schema.org Product – không khai báo đánh giá khi chưa có đánh giá thật
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    image: product.images.map((src) => new URL(src, siteConfig.url).toString()),
    sku: product.id,
    brand: { "@type": "Brand", name: siteConfig.name },
    offers: {
      "@type": "Offer",
      url: new URL(`/san-pham/${product.slug}`, siteConfig.url).toString(),
      priceCurrency: "VND",
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <div className="container-page pt-6 pb-28 lg:pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Cửa hàng", href: "/cua-hang" },
          ...(primaryOccasion ? [{ label: primaryOccasion.shortName, href: `/cua-hang?dip=${primaryOccasion.slug}` }] : []),
          { label: product.name },
        ]}
      />

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductGallery images={product.images} name={product.name} />
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            {product.badges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.badges.map((b) => (
                  <Badge key={b} tone={BADGES[b].tone}>
                    {BADGES[b].label}
                  </Badge>
                ))}
              </div>
            )}
            <h1 className="text-h1 font-bold">{product.name}</h1>
            <PriceTag price={product.price} compareAtPrice={product.compareAtPrice} size="lg" />
            <p className="text-body text-text-muted">{product.shortDescription}</p>
            <dl className="flex flex-wrap gap-x-6 gap-y-2 text-small">
              <div className="flex items-center gap-1.5">
                <Ruler className="size-4 text-primary" aria-hidden="true" />
                <dt className="text-text-muted">Kích thước:</dt>
                <dd className="font-medium">
                  {length} × {width} × {height} cm <span className="text-text-muted">(D × R × C)</span>
                </dd>
              </div>
              <div className="flex items-center gap-1.5">
                <dt className="text-text-muted">Màu có sẵn:</dt>
                <dd className="font-medium">{product.colorThemes.map((c) => COLOR_THEMES[c].label).join(", ")}</dd>
              </div>
            </dl>
          </div>

          <section aria-labelledby="contents-title" className="rounded-card bg-surface p-4 sm:p-5">
            <h2 id="contents-title" className="mb-3 font-display text-h3 font-bold">
              Bên trong hộp có gì
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {product.contents.map((c) => (
                <li key={c.name} className="flex items-center gap-2 text-small">
                  <CircleCheck className="size-5 shrink-0 text-success" aria-hidden="true" />
                  <span className="flex-1">{c.name}</span>
                  <span className="font-semibold text-text-muted tabular-nums">×{c.quantity}</span>
                </li>
              ))}
              <li className="flex items-center gap-2 text-small">
                <CircleCheck className="size-5 shrink-0 text-success" aria-hidden="true" />
                <span className="flex-1">Giấy rơm, nơ ruy băng trang trí</span>
              </li>
            </ul>
          </section>

          <ProductPurchasePanel product={product} />
          <DeliveryInfo />

          <section aria-labelledby="desc-title">
            <h2 id="desc-title" className="mb-2 font-display text-h3 font-bold">
              Câu chuyện hộp quà
            </h2>
            <p className="text-body text-text-muted">{product.description}</p>
          </section>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="mt-16">
          <h2 id="related-title" className="mb-6 text-h2 font-bold">
            Có thể bạn cũng thích
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
