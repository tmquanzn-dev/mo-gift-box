"use client";

import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { toast } from "@/components/ui/Toaster";
import { businessConfig } from "@/config/site.config";
import { formatVND } from "@/lib/format";
import { useBottomBarOffset } from "@/lib/hooks";
import { lineSurchargePerUnit } from "@/lib/pricing";
import { cardTemplatesForOccasions } from "@/services/content.service";
import { EMPTY_CUSTOMIZATION, useCartStore } from "@/store/cart.store";
import type { ColorThemeId, Customization, Product } from "@/types";
import { ColorThemePicker } from "./ColorThemePicker";
import { cleanCustomization, CustomizationFields, validateCustomization } from "./CustomizationFields";

/** Thanh mua hàng cố định ở đáy màn hình trên mobile; báo chiều cao để nút chat nổi tránh ra. */
function StickyBuyBar({ price, onAdd, onBuy, disabled }: { price: number; onAdd: () => void; onBuy: () => void; disabled: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useBottomBarOffset(ref);
  return (
    <div ref={ref} className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-float backdrop-blur lg:hidden">
      <div className="flex items-center gap-2">
        <div className="mr-auto min-w-0">
          <p className="text-caption text-text-muted">Tạm tính</p>
          <p className="font-bold text-text tabular-nums">{formatVND(price)}</p>
        </div>
        <Button variant="outline" onClick={onAdd} disabled={disabled} aria-label="Thêm vào giỏ" data-tooltip="Thêm vào giỏ" data-tooltip-side="top" className="px-4">
          <ShoppingBag className="size-5" aria-hidden="true" />
        </Button>
        <Button onClick={onBuy} disabled={disabled}>
          Mua ngay
        </Button>
      </div>
    </div>
  );
}

export function ProductPurchasePanel({ product }: { product: Product }) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const [colorTheme, setColorTheme] = useState<ColorThemeId>(product.colorThemes[0]);
  const [quantity, setQuantity] = useState(1);
  const [customization, setCustomization] = useState<Customization>({
    ...EMPTY_CUSTOMIZATION,
    cardTemplateId: cardTemplatesForOccasions(product.occasions)[0]?.id ?? null,
  });
  const [showErrors, setShowErrors] = useState(false);
  const soldOut = product.stock <= 0;
  const maxQty = Math.min(product.stock, businessConfig.stock.maxQuantityPerLine);
  const linePrice = (product.price + lineSurchargePerUnit(customization)) * quantity;

  const add = (): boolean => {
    if (Object.keys(validateCustomization(customization)).length > 0) {
      setShowErrors(true);
      document.getElementById("ca-nhan-hoa")?.scrollIntoView({ behavior: "smooth", block: "start" });
      toast.error("Lời chúc chưa hợp lệ", { description: "Bạn kiểm tra lại phần cá nhân hoá giúp MÓ nhé." });
      return false;
    }
    addItem({
      kind: "product",
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0],
      quantity,
      maxQuantity: product.stock,
      colorTheme,
      customization: cleanCustomization(customization),
      unitPrice: product.price,
      compareAtPrice: product.compareAtPrice,
    });
    return true;
  };

  const onAdd = () => {
    if (!add()) return;
    toast.success("Đã thêm vào giỏ hàng", { description: `${quantity} × ${product.name}` });
    openDrawer();
  };
  const onBuy = () => {
    if (add()) router.push("/thanh-toan");
  };

  return (
    <div className="flex flex-col gap-6">
      {product.colorThemes.length > 0 && <ColorThemePicker options={product.colorThemes} value={colorTheme} onChange={setColorTheme} />}

      {product.isCustomizable && (
        <section id="ca-nhan-hoa" aria-labelledby="customize-title" className="scroll-mt-24 rounded-card border border-border bg-surface p-4 sm:p-5">
          <h2 id="customize-title" className="mb-1 font-display text-h3 font-bold">
            Cá nhân hoá hộp quà
          </h2>
          <p className="mb-4 text-small text-text-muted">Tên người nhận, lời chúc và thiệp đều miễn phí. Bỏ trống nếu bạn muốn tự viết sau.</p>
          <CustomizationFields value={customization} onChange={setCustomization} occasions={product.occasions} showErrors={showErrors} />
        </section>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-small font-semibold">Số lượng</span>
          <QuantityStepper value={quantity} onChange={setQuantity} max={Math.max(1, maxQty)} />
        </div>
        {product.stock > 0 && product.stock <= businessConfig.stock.lowStockThreshold && (
          <p className="text-small font-medium text-warning">Chỉ còn {product.stock} hộp, bạn đặt sớm nhé!</p>
        )}
        <div className="hidden gap-3 lg:flex">
          <Button variant="outline" size="lg" fullWidth onClick={onAdd} disabled={soldOut} leftIcon={<ShoppingBag className="size-5" aria-hidden="true" />}>
            Thêm vào giỏ
          </Button>
          <Button size="lg" fullWidth onClick={onBuy} disabled={soldOut}>
            {soldOut ? "Tạm hết hàng" : `Mua ngay · ${formatVND(linePrice)}`}
          </Button>
        </div>
      </div>

      <StickyBuyBar price={linePrice} onAdd={onAdd} onBuy={onBuy} disabled={soldOut} />
    </div>
  );
}
