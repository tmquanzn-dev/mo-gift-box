import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Badge, EmptyState } from "@/components/ui/Display";
import { ORDER_STATUS_LABELS } from "@/lib/catalog";
import { formatDateTime, formatVND } from "@/lib/format";
import { getAdminDashboard } from "@/services/order.service";
import { listLowStockProducts } from "@/services/product.service";
import { requireAdmin } from "@/server/admin-auth";
import type { OrderStatus } from "@/types";

export const metadata: Metadata = { title: "Tổng quan" };

const STATUS_TONE: Record<OrderStatus, "warning" | "neutral" | "success" | "error" | "primary"> = {
  pending: "warning",
  confirmed: "primary",
  preparing: "primary",
  shipping: "primary",
  delivered: "success",
  cancelled: "error",
};

function StatCard({ label, value, hint, href }: { label: string; value: string; hint?: string; href?: string }) {
  const body = (
    <>
      <span className="text-small text-text-muted">{label}</span>
      <span className="font-display text-h2 font-bold tabular-nums">{value}</span>
      {hint && <span className="text-caption text-text-muted">{hint}</span>}
    </>
  );
  const cls = "flex flex-col gap-1 rounded-card bg-surface p-5 shadow-soft";
  return href ? (
    <Link href={href} className={`${cls} transition-shadow hover:shadow-lift`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export default async function AdminDashboardPage() {
  await requireAdmin("/admin");
  const [dash, lowStock] = await Promise.all([getAdminDashboard(), listLowStockProducts()]);
  const pending = dash.stats.pending ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h1 font-bold">Tổng quan</h1>
        <ButtonLink href="/admin/san-pham/moi" variant="secondary" size="sm" leftIcon={<Plus className="size-4" aria-hidden="true" />}>
          Thêm hộp quà
        </ButtonLink>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Chờ xác nhận" value={String(pending)} hint={pending ? "Gọi khách để chốt đơn" : "Không có đơn chờ"} href="/admin/don-hang?trang_thai=pending" />
        <StatCard label="Đang xử lý" value={String(dash.activeCount)} hint="Chưa giao xong" href="/admin/don-hang" />
        <StatCard label="Đơn hôm nay" value={String(dash.todayOrders)} />
        <StatCard label="Doanh thu hôm nay" value={formatVND(dash.todayRevenue)} hint="Không tính đơn đã huỷ" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-card bg-surface p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="font-display text-h3 font-bold">Đơn mới nhất</h2>
            <Link href="/admin/don-hang" className="inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline">
              Tất cả đơn <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          {dash.recent.length === 0 ? (
            <EmptyState title="Chưa có đơn hàng nào" description="Khi khách đặt hàng, đơn sẽ hiện ở đây và bạn nhận được thông báo." />
          ) : (
            <ul className="divide-y divide-border">
              {dash.recent.map((o) => (
                <li key={o.code}>
                  <Link href={`/admin/don-hang/${o.code}`} className="-mx-2 flex flex-wrap items-center justify-between gap-2 rounded-box px-2 py-3 hover:bg-primary-soft/40">
                    <div className="min-w-0">
                      <span className="font-mono font-semibold text-primary">{o.code}</span>
                      <span className="block truncate text-small text-text-muted">
                        {o.customer.fullName} · {formatDateTime(o.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold tabular-nums">{formatVND(o.total)}</span>
                      <Badge tone={STATUS_TONE[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-card bg-surface p-5 shadow-soft">
          <h2 className="mb-1 font-display text-h3 font-bold">Sắp hết hàng</h2>
          <p className="mb-4 text-small text-text-muted">Sản phẩm đang bán còn ít hàng trong kho.</p>
          {lowStock.length === 0 ? (
            <p className="text-small text-text-muted">Kho hàng đang ổn 👍</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {lowStock.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/san-pham/${p.id}`} className="flex items-center gap-3 rounded-box hover:bg-primary-soft/40">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-box bg-surface-sunken">
                      {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="48px" className="object-cover" />}
                    </div>
                    <span className="min-w-0 flex-1 truncate text-small font-semibold">{p.name}</span>
                    {p.stock <= 0 ? <Badge tone="error">Hết hàng</Badge> : <Badge tone="warning">Còn {p.stock}</Badge>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
