import type { Metadata } from "next";
import { CartPageView } from "@/components/features/cart/CartPageView";
import { Breadcrumb } from "@/components/ui/Display";

export const metadata: Metadata = {
  title: "Giỏ hàng",
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <div className="container-page pt-6 pb-16">
      <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Giỏ hàng" }]} />
      <h1 className="mt-4 mb-6 text-h1 font-bold">Giỏ hàng của bạn</h1>
      <CartPageView />
    </div>
  );
}
