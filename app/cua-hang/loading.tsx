import { ProductCardSkeleton, Skeleton } from "@/components/ui/Display";

export default function ShopLoading() {
  return (
    <div className="container-page pt-6 pb-16" aria-busy="true">
      <span className="sr-only" role="status">
        Đang tải danh sách hộp quà…
      </span>
      <Skeleton className="mb-6 h-4 w-40" />
      <Skeleton className="mb-2 h-10 w-72" />
      <Skeleton className="mb-8 h-4 w-32" />
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <Skeleton className="hidden h-[520px] rounded-card lg:block" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
