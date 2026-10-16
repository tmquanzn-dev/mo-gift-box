import type { Metadata } from "next";
import { PackageOpen } from "lucide-react";
import { ProductCard } from "@/components/features/product/ProductCard";
import { ShopShell } from "@/components/features/shop/ShopShell";
import { ButtonLink } from "@/components/ui/Button";
import { Breadcrumb, EmptyState } from "@/components/ui/Display";
import { getBudget, parseFilters } from "@/lib/filters";
import { getBestSellers, listOccasions, listProducts } from "@/services/product.service";

type Props = PageProps<"/cua-hang">;

async function buildTitle(searchParams: Props["searchParams"]) {
  const filters = parseFilters(await searchParams);
  const occasions = await listOccasions();
  const occasion = filters.occasions.length === 1 ? occasions.find((o) => o.slug === filters.occasions[0]) : null;
  const budget = getBudget(filters.budget);
  let title = occasion ? `Quà ${occasion.name}` : "Tất cả hộp quà";
  if (budget) title += budget.max ? ` đến ${budget.label}` : ` ${budget.label.toLowerCase()}`;
  if (filters.q) title = `Kết quả cho “${filters.q}”`;
  return { title, filters, occasions };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { title } = await buildTitle(searchParams);
  return {
    title,
    description: "Hộp quà kraft gói tay theo dịp và theo ngân sách: 20/10, 20/11, Giáng sinh, sinh nhật, kỷ yếu, Valentine, tốt nghiệp.",
    alternates: { canonical: "/cua-hang" },
  };
}

export default async function ShopPage({ searchParams }: Props) {
  const { title, filters, occasions } = await buildTitle(searchParams);
  const { items, total } = await listProducts(filters);
  const suggestions = total === 0 ? await getBestSellers(4) : [];

  return (
    <>
      <div className="container-page pt-6 pb-4">
        <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Cửa hàng" }]} />
      </div>
      <ShopShell filters={filters} occasions={occasions} total={total} title={title}>
        {total > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
            {items.map((p, i) => (
              <li key={p.id}>
                <ProductCard product={p} priority={i < 2} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col gap-8">
            <EmptyState
              icon={<PackageOpen className="size-7" aria-hidden="true" />}
              title="Chưa có hộp quà nào khớp bộ lọc"
              description="Bạn thử bỏ bớt một vài bộ lọc, hoặc để MÓ giúp bạn tự thiết kế một hộp quà theo ý mình nhé."
              action={
                <>
                  <ButtonLink href="/cua-hang" variant="secondary">
                    Xem tất cả hộp quà
                  </ButtonLink>
                  <ButtonLink href="/tu-thiet-ke" variant="outline">
                    Tự thiết kế hộp quà
                  </ButtonLink>
                </>
              }
            />
            {suggestions.length > 0 && (
              <section aria-labelledby="suggest-title">
                <h2 id="suggest-title" className="mb-4 text-h3 font-semibold">
                  Có thể bạn sẽ thích
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {suggestions.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </ShopShell>
    </>
  );
}
