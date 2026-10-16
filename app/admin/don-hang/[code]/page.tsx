import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { OrderStatusActions, ShipmentForm } from "@/components/features/admin/AdminClient";
import { OrderItemsList, OrderMoney, OrderShippingInfo, OrderTimeline } from "@/components/features/order/OrderDetails";
import { formatDateTime } from "@/lib/format";
import { getOrderByCode, STATUS_TRANSITIONS } from "@/services/order.service";
import { requireAdmin } from "@/server/admin-auth";

export async function generateMetadata({ params }: PageProps<"/admin/don-hang/[code]">): Promise<Metadata> {
  return { title: `Đơn ${(await params).code}` };
}

export default async function AdminOrderDetailPage({ params }: PageProps<"/admin/don-hang/[code]">) {
  await requireAdmin();
  const order = await getOrderByCode((await params).code);
  if (!order) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/don-hang" className="inline-flex w-fit items-center gap-1 text-small font-semibold text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" /> Tất cả đơn hàng
      </Link>
      <div>
        <h1 className="font-mono text-h1 font-bold">{order.code}</h1>
        <p className="text-small text-text-muted">Đặt lúc {formatDateTime(order.createdAt)}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <section className="rounded-card bg-surface p-5 shadow-soft">
            <h2 className="mb-4 font-display text-h3 font-bold">Sản phẩm & cá nhân hoá</h2>
            <OrderItemsList order={order} />
            <div className="mt-5 border-t border-border pt-5">
              <OrderMoney order={order} />
            </div>
          </section>
          <section className="rounded-card bg-surface p-5 shadow-soft">
            <h2 className="mb-4 font-display text-h3 font-bold">Giao hàng</h2>
            <OrderShippingInfo order={order} />
            {order.customer.email && <p className="mt-3 text-small text-text-muted">Email: {order.customer.email}</p>}
          </section>
        </div>
        <div className="flex flex-col gap-6">
          <section className="rounded-card bg-surface p-5 shadow-soft">
            <h2 className="mb-4 font-display text-h3 font-bold">Cập nhật</h2>
            <OrderStatusActions code={order.code} nextStatuses={STATUS_TRANSITIONS[order.status]} paymentStatus={order.paymentStatus} />
          </section>
          <section className="rounded-card bg-surface p-5 shadow-soft">
            <h2 className="mb-1 font-display text-h3 font-bold">Vận chuyển</h2>
            <p className="mb-4 text-small text-text-muted">Khách thấy hãng, mã vận đơn và nút theo dõi ở trang tra cứu đơn.</p>
            <ShipmentForm key={JSON.stringify(order.shipment)} code={order.code} shipment={order.shipment} />
          </section>
          <section className="rounded-card bg-surface p-5 shadow-soft">
            <h2 className="mb-4 font-display text-h3 font-bold">Trạng thái</h2>
            <OrderTimeline order={order} />
          </section>
        </div>
      </div>
    </div>
  );
}
