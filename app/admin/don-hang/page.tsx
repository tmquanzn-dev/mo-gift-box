import type { Metadata } from "next";
import Link from "next/link";
import { Badge, EmptyState } from "@/components/ui/Display";
import { Input } from "@/components/ui/Form";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/catalog";
import { formatDateTime, formatVND } from "@/lib/format";
import { cn } from "@/lib/text";
import { getOrderStats, listOrders } from "@/services/order.service";
import { requireAdmin } from "@/server/admin-auth";
import type { OrderStatus } from "@/types";

export const metadata: Metadata = { title: "Đơn hàng" };

const ALL_STATUSES: OrderStatus[] = [...ORDER_STATUS_FLOW, "cancelled"];

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/don-hang">) {
  await requireAdmin();
  const sp = await searchParams;
  const status = ALL_STATUSES.includes(sp.trang_thai as OrderStatus) ? (sp.trang_thai as OrderStatus) : null;
  const q = typeof sp.q === "string" ? sp.q : "";
  const [orders, stats] = await Promise.all([listOrders({ status, q }), getOrderStats()]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 font-bold">Đơn hàng</h1>

      <nav aria-label="Lọc theo trạng thái" className="scrollbar-none flex gap-2 overflow-x-auto">
        <Link href="/admin/don-hang" className={cn("shrink-0 rounded-full border px-4 py-2 text-small font-medium", !status ? "border-primary bg-primary text-on-dark" : "border-secondary bg-surface")}>
          Tất cả
        </Link>
        {ALL_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/don-hang?trang_thai=${s}`}
            className={cn("shrink-0 rounded-full border px-4 py-2 text-small font-medium", status === s ? "border-primary bg-primary text-on-dark" : "border-secondary bg-surface")}
          >
            {ORDER_STATUS_LABELS[s]} ({stats[s] ?? 0})
          </Link>
        ))}
      </nav>

      <form className="flex max-w-md gap-2" role="search">
        {status && <input type="hidden" name="trang_thai" value={status} />}
        <label htmlFor="admin-q" className="sr-only">
          Tìm theo mã đơn hoặc số điện thoại
        </label>
        <Input id="admin-q" name="q" defaultValue={q} placeholder="Mã đơn hoặc số điện thoại" className="h-11" />
        <button type="submit" className="h-11 shrink-0 rounded-full bg-primary px-5 font-semibold text-on-dark">
          Tìm
        </button>
      </form>

      {orders.length === 0 ? (
        <EmptyState title="Chưa có đơn hàng nào" description="Đơn mới từ website sẽ hiện ở đây." />
      ) : (
        <div className="overflow-x-auto rounded-card bg-surface shadow-soft">
          <table className="w-full min-w-[720px] text-left text-small">
            <thead className="border-b border-border text-text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Mã đơn</th>
                <th scope="col" className="px-4 py-3 font-semibold">Khách hàng</th>
                <th scope="col" className="px-4 py-3 font-semibold">Tổng tiền</th>
                <th scope="col" className="px-4 py-3 font-semibold">Thanh toán</th>
                <th scope="col" className="px-4 py-3 font-semibold">Trạng thái</th>
                <th scope="col" className="px-4 py-3 font-semibold">Đặt lúc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => (
                <tr key={o.code} className="hover:bg-primary-soft/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/don-hang/${o.code}`} className="font-mono font-semibold text-primary underline">
                      {o.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {o.customer.fullName}
                    <span className="block text-caption text-text-muted">{o.customer.phone}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums">{formatVND(o.total)}</td>
                  <td className="px-4 py-3">
                    {o.paymentMethod === "cod" ? "COD" : "Chuyển khoản"}
                    <span className="block text-caption text-text-muted">{PAYMENT_STATUS_LABELS[o.paymentStatus]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={o.status === "cancelled" ? "error" : o.status === "delivered" ? "success" : o.status === "pending" ? "warning" : "neutral"}>
                      {ORDER_STATUS_LABELS[o.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{formatDateTime(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
