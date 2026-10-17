"use client";

import { Plus } from "lucide-react";
import { toast } from "@/components/ui/Toaster";
import { EMPTY_CUSTOMIZATION, useCartStore } from "@/store/cart.store";
import type { Product } from "@/types";

/** Thêm nhanh hộp quà vào giỏ với màu mặc định – khách có thể cá nhân hoá sau trong giỏ hàng. */
export function QuickAddButton({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  return (
    <button
      type="button"
      aria-label={`Thêm nhanh ${product.name} vào giỏ`}
      data-tooltip="Thêm nhanh vào giỏ"
      data-tooltip-side="left"
      onClick={() => {
        addItem({
          kind: "product",
          productId: product.id,
          slug: product.slug,
          name: product.name,
          image: product.images[0],
          quantity: 1,
          maxQuantity: product.stock,
          colorTheme: product.colorThemes[0],
          customization: EMPTY_CUSTOMIZATION,
          unitPrice: product.price,
          compareAtPrice: product.compareAtPrice,
        });
        toast.success("Đã thêm vào giỏ", { description: `${product.name} · Bạn có thể thêm lời chúc trong giỏ hàng.` });
        openDrawer();
      }}
      className="relative z-10 flex size-11 items-center justify-center rounded-full bg-primary text-on-dark shadow-lift transition-transform hover:scale-105 hover:bg-primary-hover"
    >
      <Plus className="size-5" aria-hidden="true" />
    </button>
  );
}
