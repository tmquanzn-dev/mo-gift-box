import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderLookup } from "@/components/features/order/OrderLookup";
import { Breadcrumb, Skeleton } from "@/components/ui/Display";

export const metadata: Metadata = {
  title: "Tra cứu đơn hàng",
  description: "Nhập mã đơn và số điện thoại để theo dõi trạng thái hộp quà MÓ của bạn.",
  alternates: { canonical: "/tra-cuu-don-hang" },
};

export default function OrderLookupPage() {
  return (
    <div className="container-page pt-6 pb-16">
      <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Tra cứu đơn hàng" }]} />
      <h1 className="mt-4 mb-8 text-h1 font-bold">Tra cứu đơn hàng</h1>
      <Suspense fallback={<Skeleton className="h-80 rounded-card" />}>
        <OrderLookup />
      </Suspense>
    </div>
  );
}
