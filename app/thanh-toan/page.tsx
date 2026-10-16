import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutFlow } from "@/components/features/checkout/CheckoutFlow";
import { Skeleton } from "@/components/ui/Display";

export const metadata: Metadata = {
  title: "Thanh toán",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="container-page pt-6 pb-16">
      <h1 className="mb-6 text-h1 font-bold">Thanh toán</h1>
      <Suspense fallback={<Skeleton className="h-[560px] rounded-card" />}>
        <CheckoutFlow />
      </Suspense>
    </div>
  );
}
