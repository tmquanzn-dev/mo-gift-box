import Image from "next/image";
import { BadgeCheck, CircleX, ClipboardList, ExternalLink, Gift, MapPinned, PackageCheck, Phone, Truck, type LucideIcon } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { siteConfig } from "@/config/site.config";
import { COLOR_THEMES, ORDER_STATUS_FLOW, ORDER_STATUS_HINTS, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/catalog";
import { CARRIERS, trackingLink, trackingLinkHasCode } from "@/lib/carriers";
import { formatDateTime, formatDeliveryRange, formatVND } from "@/lib/format";
import { cn } from "@/lib/text";
import type { Order, OrderStatus, Shipment } from "@/types";
import { CopyCodeInline } from "./CopyCodeInline";
import { BoxContentsSummary, CustomizationSummary } from "./CustomizationSummary";

/** Link ảnh QR theo chuẩn VietQR (img.vietqr.io). Trả về null khi chưa cấu hình số tài khoản thật. */
export function vietQrUrl(amount: number, content: string): string | null {
  const { bankId, accountNumber, accountName } = siteConfig.bank;
  if (!/^\d{6,20}$/.test(accountNumber) || !/^\d{6}$/.test(bankId)) return null;
  const params = new URLSearchParams({ amount: String(amount), addInfo: content, accountName });
  return `https://img.vietqr.io/image/${bankId}-${accountNumber}-compact2.png?${params}`;
}

export function BankTransferBox({ order }: { order: Order }) {
  const qr = vietQrUrl(order.total, order.code);
  const { bank } = siteConfig;
  return (
    <div className="grid gap-5 rounded-card border-2 border-primary/20 bg-surface p-5 sm:grid-cols-[200px_1fr]">
      <div className="relative mx-auto aspect-square w-48 overflow-hidden rounded-box bg-white sm:w-full">
        {qr ? (
          <Image src={qr} alt={`Mã VietQR chuyển khoản ${formatVND(order.total)} cho đơn ${order.code}`} fill sizes="200px" className="object-contain" unoptimized />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 border-2 border-dashed border-secondary p-4 text-center text-caption text-text-muted">
            <span className="font-semibold text-text">Mã QR VietQR</span>
            Điền số tài khoản thật trong config/site.config.ts để hiển thị QR.
          </div>
        )}
      </div>
      <dl className="flex flex-col gap-2 text-small">
        <div>
          <dt className="text-text-muted">Ngân hàng</dt>
          <dd className="font-semibold">{bank.bankName}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Số tài khoản</dt>
          <dd className="font-mono text-body font-semibold">{bank.accountNumber}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Chủ tài khoản</dt>
          <dd className="font-semibold">{bank.accountName}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Số tiền</dt>
          <dd className="text-h3 font-bold text-text tabular-nums">{formatVND(order.total)}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Nội dung chuyển khoản</dt>
          <dd className="w-fit rounded-box bg-primary-soft px-3 py-1 font-mono text-body font-bold tracking-wider text-primary">{order.code}</dd>
        </div>
        <p className="text-caption text-text-muted">Bạn ghi đúng nội dung để MÓ xác nhận nhanh nhé. Đơn được chuẩn bị ngay khi MÓ nhận được tiền.</p>
      </dl>
    </div>
  );
}

const STEP_ICONS: Record<Exclude<OrderStatus, "cancelled">, LucideIcon> = {
  pending: ClipboardList,
  confirmed: BadgeCheck,
  preparing: Gift,
  shipping: Truck,
  delivered: PackageCheck,
};

/**
 * Theo dõi đơn kiểu sàn TMĐT: thanh tiến trình 5 bước có icon, thẻ vận chuyển (hãng, mã vận đơn, shipper)
 * và lịch sử cập nhật mới nhất ở trên cùng.
 */
export function OrderTimeline({ order }: { order: Order }) {
  const history = [...order.events].reverse();
  return (
    <div className="flex flex-col gap-6">
      {order.status === "cancelled" ? <CancelledBanner order={order} /> : <ProgressSteps order={order} />}
      {order.shipment && order.status !== "cancelled" && <ShipmentCard shipment={order.shipment} delivered={order.status === "delivered"} />}
      {history.length > 0 && (
        <div>
          <h3 className="mb-3 text-small font-bold tracking-[0.08em] text-text-muted uppercase">Lịch sử đơn hàng</h3>
          <ol className="flex flex-col" aria-label="Lịch sử cập nhật đơn hàng, mới nhất trước">
            {history.map((event, i) => {
              const latest = i === 0;
              const tone = event.status === "cancelled" ? "error" : "success";
              return (
                <li key={`${event.status}-${event.createdAt}`} className="relative flex gap-3 pb-4 last:pb-0">
                  {i < history.length - 1 && <span className="absolute top-4 left-[5px] h-full w-px bg-border" aria-hidden="true" />}
                  <span
                    className={cn(
                      "relative mt-1.5 size-[11px] shrink-0 rounded-full",
                      latest ? (tone === "error" ? "bg-error ring-4 ring-error/15" : "bg-success ring-4 ring-success/15") : "bg-border-strong",
                    )}
                    aria-hidden="true"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:gap-4">
                    <time dateTime={event.createdAt} className="shrink-0 text-small text-text-muted tabular-nums sm:w-36">
                      {formatDateTime(event.createdAt)}
                    </time>
                    <div className="min-w-0">
                      <p className={cn("font-semibold", latest ? (tone === "error" ? "text-error" : "text-success") : "text-text")}>{ORDER_STATUS_LABELS[event.status]}</p>
                      <p className="text-small text-text-muted">{event.note || ORDER_STATUS_HINTS[event.status]}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}

function CancelledBanner({ order }: { order: Order }) {
  const event = order.events.find((e) => e.status === "cancelled");
  return (
    <div className="flex items-start gap-3 rounded-card bg-error-bg p-4 text-error">
      <CircleX className="size-6 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-semibold">Đơn hàng đã huỷ</p>
        {event && (
          <p className="text-small">
            {formatDateTime(event.createdAt)}
            {event.note ? ` · ${event.note}` : ""}
          </p>
        )}
      </div>
    </div>
  );
}

function ProgressSteps({ order }: { order: Order }) {
  const currentIndex = ORDER_STATUS_FLOW.indexOf(order.status);
  const current = ORDER_STATUS_FLOW[currentIndex];
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-card bg-primary-soft px-4 py-3">
        <p className="font-display text-h3 font-bold text-primary">{ORDER_STATUS_LABELS[current]}</p>
        <p className="text-small text-text-muted">
          {current === "delivered" ? ORDER_STATUS_HINTS.delivered : `${ORDER_STATUS_HINTS[current]} Dự kiến giao ${formatDeliveryRange(order.expectedDeliveryDate)}.`}
        </p>
      </div>
      <ol className="grid grid-cols-5" aria-label="Tiến trình đơn hàng">
        {ORDER_STATUS_FLOW.map((status, i) => {
          const done = i <= currentIndex;
          const isCurrent = i === currentIndex;
          const Icon = STEP_ICONS[status as Exclude<OrderStatus, "cancelled">];
          const event = order.events.find((e) => e.status === status);
          return (
            <li key={status} className="relative flex flex-col items-center gap-2 text-center" aria-current={isCurrent ? "step" : undefined}>
              {i > 0 && (
                <span
                  className={cn("absolute top-5 right-1/2 h-1 w-full -translate-y-1/2 rounded-full sm:top-6", i <= currentIndex ? "bg-success" : "bg-border")}
                  aria-hidden="true"
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex size-10 items-center justify-center rounded-full border-2 sm:size-12",
                  done ? "border-success bg-success text-white" : "border-border-strong bg-surface text-text-muted",
                  isCurrent && "ring-4 ring-success/20",
                )}
              >
                <Icon className="size-5 sm:size-6" aria-hidden="true" />
              </span>
              <span className={cn("px-0.5 text-caption leading-tight font-semibold sm:text-small", done ? "text-text" : "text-text-muted")}>
                {ORDER_STATUS_LABELS[status]}
                <span className="sr-only">{done ? " (đã hoàn thành)" : " (chưa đến)"}</span>
              </span>
              {event && <span className="hidden text-caption text-text-muted tabular-nums sm:block">{formatDateTime(event.createdAt)}</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ShipmentCard({ shipment, delivered }: { shipment: Shipment; delivered: boolean }) {
  const carrier = CARRIERS[shipment.carrier];
  const link = trackingLink(shipment.carrier, shipment.trackingCode);
  const linkHasCode = trackingLinkHasCode(shipment.carrier);
  return (
    <div className="flex flex-col gap-4 rounded-card border-2 border-success/25 bg-success-bg/50 p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success text-white">
          <Truck className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-small text-text-muted">{delivered ? "Đã giao bởi" : "Đơn vị vận chuyển"}</p>
          <p className="font-semibold">{carrier.label}</p>
          {shipment.trackingCode && (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-small text-text-muted">Mã vận đơn</span>
              <CopyCodeInline code={shipment.trackingCode} />
            </div>
          )}
        </div>
      </div>
      {(shipment.shipperName || shipment.shipperPhone) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-success/20 pt-3">
          <div>
            <p className="text-small text-text-muted">Shipper</p>
            <p className="font-semibold">{[shipment.shipperName, shipment.shipperPhone].filter(Boolean).join(" · ")}</p>
          </div>
          {shipment.shipperPhone && !delivered && (
            <a href={`tel:${shipment.shipperPhone}`} className={buttonClasses("outline", "sm")}>
              <Phone className="size-4" aria-hidden="true" /> Gọi shipper
            </a>
          )}
        </div>
      )}
      {link && (
        <div className="flex flex-col gap-1.5">
          <a href={link} target="_blank" rel="noopener noreferrer" className={buttonClasses("secondary", "md", "w-full sm:w-fit")}>
            <MapPinned className="size-5" aria-hidden="true" />
            Theo dõi hành trình trên {carrier.shortLabel}
            <ExternalLink className="size-4" aria-hidden="true" />
            <span className="sr-only"> (mở tab mới)</span>
          </a>
          {!linkHasCode && shipment.trackingCode && <p className="text-caption text-text-muted">Sao chép mã vận đơn ở trên rồi dán vào trang tra cứu của hãng.</p>}
        </div>
      )}
    </div>
  );
}

export function OrderItemsList({ order }: { order: Order }) {
  return (
    <ul className="flex flex-col divide-y divide-border">
      {order.items.map((item, index) => (
        <li key={`${item.name}-${index}`} className="flex gap-3 py-3 first:pt-0 last:pb-0">
          <span className="relative size-16 shrink-0 overflow-hidden rounded-box bg-surface-sunken">
            <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex justify-between gap-2">
              <p className="font-semibold">
                {item.name} <span className="font-normal text-text-muted">×{item.quantity}</span>
              </p>
              <p className="font-semibold tabular-nums">{formatVND(item.unitPrice * item.quantity)}</p>
            </div>
            <p className="text-caption text-text-muted">Màu {COLOR_THEMES[item.colorTheme]?.label ?? item.colorTheme}</p>
            <BoxContentsSummary box={item.box} />
            <CustomizationSummary customization={item.customization} className="mt-1" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function OrderMoney({ order }: { order: Order }) {
  const rows: [string, number, boolean?][] = [
    ["Tạm tính", order.subtotal],
    ...(order.discount > 0 ? [[`Giảm giá${order.couponCode ? ` (${order.couponCode})` : ""}`, -order.discount, true] as [string, number, boolean]] : []),
    ...(order.surcharges.handwrittenCard > 0 ? [["Thiệp viết tay", order.surcharges.handwrittenCard] as [string, number]] : []),
    ...(order.surcharges.premiumWrap > 0 ? [["Gói quà cao cấp", order.surcharges.premiumWrap] as [string, number]] : []),
    ...(order.surcharges.expressDelivery > 0 ? [["Giao nhanh trong ngày", order.surcharges.expressDelivery] as [string, number]] : []),
  ];
  return (
    <dl className="flex flex-col gap-2 text-small">
      {rows.map(([label, value, discount]) => (
        <div key={label} className="flex justify-between gap-4">
          <dt className="text-text-muted">{label}</dt>
          <dd className={cn("font-semibold tabular-nums", discount && "text-success")}>{discount ? `-${formatVND(-value)}` : formatVND(value)}</dd>
        </div>
      ))}
      <div className="flex justify-between gap-4">
        <dt className="text-text-muted">Phí vận chuyển</dt>
        <dd className="font-semibold tabular-nums">{order.shippingFee === 0 ? "Miễn phí" : formatVND(order.shippingFee)}</dd>
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-border pt-3">
        <dt className="font-semibold">Tổng cộng</dt>
        <dd className="text-h3 font-bold tabular-nums">{formatVND(order.total)}</dd>
      </div>
    </dl>
  );
}

export function OrderShippingInfo({ order }: { order: Order }) {
  return (
    <dl className="grid gap-3 text-small sm:grid-cols-2">
      <div>
        <dt className="text-text-muted">Người nhận</dt>
        <dd className="font-semibold">
          {order.recipient.fullName} · {order.recipient.phone}
        </dd>
      </div>
      <div>
        <dt className="text-text-muted">Người đặt</dt>
        <dd className="font-semibold">
          {order.customer.fullName} · {order.customer.phone}
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-text-muted">Địa chỉ</dt>
        <dd className="font-semibold">
          {order.address.street}, {order.address.wardName}, {order.address.provinceName}
        </dd>
        {order.address.note && <dd className="text-text-muted">Ghi chú: {order.address.note}</dd>}
      </div>
      <div>
        <dt className="text-text-muted">{order.preferredDate ? "Ngày giao theo hẹn" : "Giao dự kiến"}</dt>
        <dd className="font-semibold">
          {formatDeliveryRange(order.expectedDeliveryDate)}
          {order.express && " · Giao nhanh"}
        </dd>
      </div>
      <div>
        <dt className="text-text-muted">Thanh toán</dt>
        <dd className="font-semibold">
          {PAYMENT_METHOD_LABELS[order.paymentMethod]} · {PAYMENT_STATUS_LABELS[order.paymentStatus]}
        </dd>
      </div>
      {order.hidePrice && (
        <div className="sm:col-span-2">
          <dd className="text-text-muted">✓ Giấu giá trên hoá đơn</dd>
        </div>
      )}
    </dl>
  );
}
