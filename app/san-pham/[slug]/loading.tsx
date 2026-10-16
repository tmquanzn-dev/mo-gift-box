import { Skeleton } from "@/components/ui/Display";

export default function ProductLoading() {
  return (
    <div className="container-page pt-6 pb-16" aria-busy="true">
      <span className="sr-only" role="status">
        Đang tải hộp quà…
      </span>
      <Skeleton className="h-4 w-64" />
      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col gap-3">
          <Skeleton className="aspect-square w-full rounded-card" />
          <div className="grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-10 w-4/5" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-48 w-full rounded-card" />
          <Skeleton className="h-96 w-full rounded-card" />
        </div>
      </div>
    </div>
  );
}
