import Link from "next/link";
import { ProductCard } from "@/components/features/product/ProductCard";
import { ButtonLink } from "@/components/ui/Button";
import { getBestSellers } from "@/services/product.service";

export default async function NotFound() {
  const suggestions = await getBestSellers(4).catch(() => []);
  return (
    <div className="container-page py-16">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
        <p className="font-display text-[5rem] leading-none font-black text-secondary" aria-hidden="true">
          404
        </p>
        <h1 className="text-h1 font-bold">Ôi, hộp quà này lạc mất rồi</h1>
        <p className="text-text-muted">Trang bạn tìm không tồn tại hoặc đã được chuyển đi. Mình cùng quay lại chọn quà nhé.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <ButtonLink href="/cua-hang">Xem tất cả hộp quà</ButtonLink>
          <ButtonLink href="/" variant="outline">
            Về trang chủ
          </ButtonLink>
        </div>
        <p className="text-small text-text-muted">
          Đang tìm đơn hàng?{" "}
          <Link href="/tra-cuu-don-hang" className="font-semibold text-primary underline">
            Tra cứu đơn tại đây
          </Link>
        </p>
      </div>
      {suggestions.length > 0 && (
        <section aria-labelledby="suggest-404" className="mt-16">
          <h2 id="suggest-404" className="mb-6 text-h2 font-bold">
            Có thể bạn đang tìm
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {suggestions.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
