"use client";

import { ArrowRight, Lock, ShoppingBag } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/Display";
import { useCartStore } from "@/store/cart.store";
import { useCartTotals } from "@/store/use-cart-totals";
import { CartLineItem } from "./CartLineItem";
import { CouponInput } from "./CouponInput";
import { FreeShipProgress, OrderTotals } from "./OrderTotals";

export function CartPageView() {
  const items = useCartStore((s) => s.items);
  const hydrated = useCartStore((s) => s.hydrated);
  const couponCode = useCartStore((s) => s.couponCode);
  const totals = useCartTotals();

  if (!hydrated) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]" aria-busy="true">
        <span className="sr-only" role="status">
          Đang tải giỏ hàng…
        </span>
        <div className="flex flex-col gap-4 rounded-card bg-surface p-5">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="size-28" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-9 w-32 rounded-full" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-80 rounded-card" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-7" aria-hidden="true" />}
        title="Giỏ hàng đang trống"
        description="Chưa có hộp quà nào ở đây. Dạo một vòng cửa hàng, hoặc tự thiết kế hộp quà theo ý bạn nhé."
        action={
          <>
            <ButtonLink href="/cua-hang">Chọn quà ngay</ButtonLink>
            <ButtonLink href="/tu-thiet-ke" variant="outline">
              Tự thiết kế hộp quà
            </ButtonLink>
          </>
        }
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <section aria-label="Sản phẩm trong giỏ" className="rounded-card bg-surface px-4 shadow-soft sm:px-6">
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <CartLineItem key={item.lineId} item={item} />
          ))}
        </ul>
      </section>

      <aside aria-label="Tóm tắt đơn hàng" className="lg:sticky lg:top-24 lg:self-start">
        <div className="flex flex-col gap-5 rounded-card bg-surface p-5 shadow-soft">
          <FreeShipProgress totals={totals} />
          <CouponInput />
          <OrderTotals totals={totals} couponCode={couponCode} />
          <ButtonLink href="/thanh-toan" size="lg" fullWidth rightIcon={<ArrowRight className="size-5" aria-hidden="true" />}>
            Tiến hành thanh toán
          </ButtonLink>
          <p className="flex items-center justify-center gap-1.5 text-caption text-text-muted">
            <Lock className="size-3.5" aria-hidden="true" />
            Không cần tạo tài khoản · Thanh toán trong 3 bước
          </p>
        </div>
      </aside>
    </div>
  );
}
