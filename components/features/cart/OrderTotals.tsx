import { Truck } from "lucide-react";
import { ProgressBar } from "@/components/ui/Display";
import { businessConfig } from "@/config/site.config";
import { formatVND } from "@/lib/format";
import type { Totals } from "@/lib/pricing";
import { cn } from "@/lib/text";

export function FreeShipProgress({ totals }: { totals: Pick<Totals, "freeShippingRemaining" | "freeShippingProgress" | "isFreeShipping"> }) {
  return (
    <div className="rounded-box bg-primary-soft/70 p-3">
      <p className="mb-2 flex items-center gap-2 text-small text-text">
        <Truck className="size-4 shrink-0 text-primary" aria-hidden="true" />
        {totals.isFreeShipping ? (
          <span className="font-semibold text-success">Tuyệt! Đơn của bạn được miễn phí vận chuyển.</span>
        ) : (
          <span>
            Mua thêm <strong className="tabular-nums">{formatVND(totals.freeShippingRemaining)}</strong> để được miễn phí vận chuyển
          </span>
        )}
      </p>
      <ProgressBar value={totals.freeShippingProgress} label="Tiến độ đạt mốc miễn phí vận chuyển" />
    </div>
  );
}

function Row({ label, value, tone, hint }: { label: string; value: string; tone?: "discount" | "muted"; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-small">
      <dt className="text-text-muted">
        {label}
        {hint && <span className="block text-caption">{hint}</span>}
      </dt>
      <dd className={cn("font-semibold tabular-nums", tone === "discount" ? "text-success" : "text-text", tone === "muted" && "font-normal text-text-muted")}>{value}</dd>
    </div>
  );
}

/** Bảng tạm tính → giảm giá → phụ phí → phí ship → tổng cộng. */
export function OrderTotals({ totals, couponCode, className }: { totals: Totals; couponCode?: string | null; className?: string }) {
  const { shipping } = businessConfig;
  const shippingLabel =
    totals.shippingFee === null ? `${formatVND(shipping.innerCityFee)} – ${formatVND(shipping.outerFee)}` : totals.shippingFee === 0 ? "Miễn phí" : formatVND(totals.shippingFee);
  return (
    <dl className={cn("flex flex-col gap-2.5", className)}>
      <Row label={`Tạm tính (${totals.itemCount} hộp)`} value={formatVND(totals.subtotal)} />
      {totals.discount > 0 && <Row label={`Giảm giá${couponCode ? ` (${couponCode})` : ""}`} value={`-${formatVND(totals.discount)}`} tone="discount" />}
      {totals.surcharges.handwrittenCard > 0 && <Row label="Thiệp viết tay" value={formatVND(totals.surcharges.handwrittenCard)} />}
      {totals.surcharges.premiumWrap > 0 && <Row label="Gói quà cao cấp" value={formatVND(totals.surcharges.premiumWrap)} />}
      {totals.surcharges.expressDelivery > 0 && <Row label="Giao nhanh trong ngày" value={formatVND(totals.surcharges.expressDelivery)} />}
      <Row
        label="Phí vận chuyển"
        value={shippingLabel}
        tone={totals.shippingFee === null ? "muted" : undefined}
        hint={totals.shippingFee === null ? "Tính chính xác khi bạn chọn địa chỉ" : undefined}
      />
      <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-border pt-3">
        <dt className="font-semibold text-text">Tổng cộng</dt>
        <dd className="text-h3 font-bold text-text tabular-nums">
          {formatVND(totals.total)}
          {totals.shippingFee === null && <span className="block text-right text-caption font-normal text-text-muted">chưa gồm phí ship</span>}
        </dd>
      </div>
    </dl>
  );
}
