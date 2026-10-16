"use client";

import { ShoppingBag } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Display";
import { Drawer } from "@/components/ui/Overlay";
import { formatVND } from "@/lib/format";
import { useCartStore } from "@/store/cart.store";
import { useCartTotals } from "@/store/use-cart-totals";
import { CartLineItem } from "./CartLineItem";
import { FreeShipProgress } from "./OrderTotals";

export function CartDrawer() {
  const open = useCartStore((s) => s.drawerOpen);
  const close = useCartStore((s) => s.closeDrawer);
  const items = useCartStore((s) => s.items);
  const hydrated = useCartStore((s) => s.hydrated);
  const totals = useCartTotals();
  const pathname = usePathname();

  useEffect(() => {
    close();
  }, [pathname, close]);

  const empty = hydrated && items.length === 0;

  return (
    <Drawer
      open={open}
      onClose={close}
      title={`Giỏ hàng${items.length ? ` (${totals.itemCount})` : ""}`}
      footer={
        !empty && (
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <span className="text-text-muted">Tạm tính</span>
              <span className="text-h3 font-bold tabular-nums">{formatVND(totals.subtotal - totals.discount + totals.surchargeTotal)}</span>
            </div>
            <p className="-mt-2 text-caption text-text-muted">Phí vận chuyển tính ở bước thanh toán.</p>
            <ButtonLink href="/thanh-toan" size="lg" fullWidth>
              Thanh toán
            </ButtonLink>
            <ButtonLink href="/gio-hang" variant="ghost" fullWidth>
              Xem giỏ hàng & mã giảm giá
            </ButtonLink>
          </div>
        )
      }
    >
      {empty ? (
        <EmptyState
          className="m-5"
          icon={<ShoppingBag className="size-7" aria-hidden="true" />}
          title="Giỏ hàng đang trống"
          description="Chọn một hộp quà xinh cho người bạn thương nhé."
          action={
            <Button variant="secondary" onClick={close}>
              Tiếp tục mua sắm
            </Button>
          }
        />
      ) : (
        <div className="px-5">
          <div className="pt-4">
            <FreeShipProgress totals={totals} />
          </div>
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <CartLineItem key={item.lineId} item={item} compact />
            ))}
          </ul>
        </div>
      )}
    </Drawer>
  );
}
