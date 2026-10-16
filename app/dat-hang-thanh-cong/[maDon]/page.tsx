import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CircleCheck, Lock, PackageSearch } from "lucide-react";
import { CopyCodeInline } from "@/components/features/order/CopyCodeInline";
import { BankTransferBox, OrderItemsList, OrderMoney, OrderShippingInfo, OrderTimeline } from "@/components/features/order/OrderDetails";
import { ButtonLink } from "@/components/ui/Button";
import { siteConfig } from "@/config/site.config";
import { formatDeliveryRange } from "@/lib/format";
import { normalizeOrderCode, ORDER_CODE_PATTERN } from "@/lib/order-code";
import { getOrderByCode } from "@/services/order.service";
import { getCurrentUser } from "@/server/auth";
import { hasOrderAccess } from "@/server/order-access";
import { isOrderOwnedBy } from "@/services/user.service";

export const metadata: Metadata = {
  title: "Đặt hàng thành công",
  robots: { index: false, follow: false },
};

export default async function OrderSuccessPage({ params }: PageProps<"/dat-hang-thanh-cong/[maDon]">) {
  const code = normalizeOrderCode((await params).maDon);
  if (!ORDER_CODE_PATTERN.test(code)) notFound();

  // Chỉ trình duyệt vừa đặt đơn (hoặc đã xác minh số điện thoại), chủ tài khoản của đơn, hoặc quản trị viên mới xem được chi tiết
  const user = await getCurrentUser();
  const allowed = (await hasOrderAccess(code)) || user?.role === "admin" || (user ? await isOrderOwnedBy(code, user.id) : false);
  if (!allowed) {
    return (
      <div className="container-page flex justify-center py-16">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-card bg-surface p-8 text-center shadow-soft">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Lock className="size-6" aria-hidden="true" />
          </span>
          <h1 className="text-h2 font-bold">Xác minh để xem đơn {code}</h1>
          <p className="text-text-muted">Để bảo vệ thông tin người nhận, bạn nhập số điện thoại đặt hàng ở trang tra cứu nhé.</p>
          <ButtonLink href={`/tra-cuu-don-hang?ma=${code}`} variant="secondary" leftIcon={<PackageSearch className="size-5" aria-hidden="true" />}>
            Tra cứu đơn hàng
          </ButtonLink>
        </div>
      </div>
    );
  }

  const order = await getOrderByCode(code);
  if (!order) notFound();

  return (
    <div className="container-page max-w-4xl pt-8 pb-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-16 animate-bump items-center justify-center rounded-full bg-success-bg text-success">
          <CircleCheck className="size-9" aria-hidden="true" />
        </span>
        <h1 className="text-h1 font-bold">Cảm ơn bạn, MÓ đã nhận đơn!</h1>
        <p className="max-w-lg text-text-muted">
          {order.paymentMethod === "bank_transfer"
            ? "Bạn chuyển khoản theo thông tin bên dưới, MÓ sẽ gói quà ngay khi nhận được tiền."
            : `MÓ sẽ gọi ${order.customer.phone} để xác nhận trong ít phút nữa.`}
        </p>
        <div className="mt-2 flex flex-col items-center gap-1">
          <span className="text-small text-text-muted">Mã đơn hàng</span>
          <CopyCodeInline code={order.code} />
        </div>
        <p className="text-small">
          Giao {order.preferredDate ? "theo hẹn" : "dự kiến"}: <strong>{formatDeliveryRange(order.expectedDeliveryDate)}</strong>
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-6">
        {order.paymentMethod === "bank_transfer" && order.paymentStatus === "unpaid" && (
          <section aria-labelledby="pay-title">
            <h2 id="pay-title" className="mb-3 font-display text-h3 font-bold">
              Hướng dẫn chuyển khoản
            </h2>
            <BankTransferBox order={order} />
          </section>
        )}

        <section aria-labelledby="track-title" className="rounded-card bg-surface p-5 shadow-soft">
          <h2 id="track-title" className="mb-4 font-display text-h3 font-bold">
            Theo dõi đơn hàng
          </h2>
          <OrderTimeline order={order} />
        </section>

        <section aria-labelledby="items-title" className="rounded-card bg-surface p-5 shadow-soft">
          <h2 id="items-title" className="mb-4 font-display text-h3 font-bold">
            Tóm tắt đơn hàng
          </h2>
          <OrderItemsList order={order} />
          <div className="mt-5 border-t border-border pt-5">
            <OrderMoney order={order} />
          </div>
        </section>

        <section aria-labelledby="ship-title" className="rounded-card bg-surface p-5 shadow-soft">
          <h2 id="ship-title" className="mb-4 font-display text-h3 font-bold">
            Thông tin giao hàng
          </h2>
          <OrderShippingInfo order={order} />
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <ButtonLink href={`/tra-cuu-don-hang?ma=${order.code}`} variant="secondary" size="lg" leftIcon={<PackageSearch className="size-5" aria-hidden="true" />}>
            Tra cứu đơn hàng
          </ButtonLink>
          <ButtonLink href="/cua-hang" variant="outline" size="lg">
            Tiếp tục mua sắm
          </ButtonLink>
        </div>
        <p className="text-center text-small text-text-muted">
          Cần đổi thông tin đơn? Gọi MÓ qua{" "}
          <a href={`tel:${siteConfig.contact.hotlineTel}`} className="font-semibold text-primary underline">
            {siteConfig.contact.hotline}
          </a>{" "}
          và đọc mã đơn nhé.
        </p>
      </div>
    </div>
  );
}
