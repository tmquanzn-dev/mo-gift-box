import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, LayoutDashboard, PackageOpen } from "lucide-react";
import { ChangePasswordForm, LogoutButton, ProfileForm } from "@/components/features/account/AccountClient";
import { ButtonLink } from "@/components/ui/Button";
import { Badge, Breadcrumb, EmptyState } from "@/components/ui/Display";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/catalog";
import { formatDateTime, formatVND } from "@/lib/format";
import { requireUser } from "@/server/auth";
import { listUserOrders } from "@/services/user.service";
import type { OrderStatus, PaymentStatus } from "@/types";

export const metadata: Metadata = {
  title: "Tài khoản của tôi",
  robots: { index: false, follow: false },
};

const statusTone = (s: OrderStatus) => (s === "cancelled" ? "error" : s === "delivered" ? "success" : s === "pending" ? "warning" : "neutral");

export default async function AccountPage({ searchParams }: PageProps<"/tai-khoan">) {
  const user = await requireUser("/tai-khoan");
  const [orders, sp] = await Promise.all([listUserOrders(user.id), searchParams]);
  const noPermission = sp.loi === "khong-co-quyen";

  return (
    <div className="container-page pt-6 pb-16">
      <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Tài khoản" }]} />
      <div className="mt-4 mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h1 font-bold">Xin chào, {user.fullName}</h1>
          <p className="text-text-muted">
            {user.email}
            {user.role === "admin" && (
              <Badge tone="primary" className="ml-2 align-middle">
                Quản trị viên
              </Badge>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {user.role === "admin" && (
            <ButtonLink href="/admin" variant="secondary" size="sm" leftIcon={<LayoutDashboard className="size-4" aria-hidden="true" />}>
              Trang quản trị
            </ButtonLink>
          )}
          <LogoutButton />
        </div>
      </div>

      {noPermission && (
        <p role="alert" className="mb-6 rounded-box bg-warning-bg px-4 py-3 text-small font-medium text-text">
          Tài khoản của bạn không có quyền vào trang quản trị.
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <section aria-labelledby="don-hang-cua-toi" className="flex flex-col gap-4">
          <h2 id="don-hang-cua-toi" className="text-h3 font-bold">
            Đơn hàng của tôi
          </h2>
          {orders.length === 0 ? (
            <EmptyState
              icon={<PackageOpen className="size-7" aria-hidden="true" />}
              title="Bạn chưa có đơn hàng nào"
              description="Đơn đặt khi đã đăng nhập sẽ hiện ở đây để bạn theo dõi."
              action={<ButtonLink href="/cua-hang">Chọn hộp quà</ButtonLink>}
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {orders.map((o) => (
                <li key={o.code}>
                  <Link
                    href={`/dat-hang-thanh-cong/${o.code}`}
                    className="flex items-center gap-4 rounded-card bg-surface p-4 shadow-soft transition-shadow hover:shadow-lift"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold tabular-nums">{o.code}</span>
                        <Badge tone={statusTone(o.status as OrderStatus)}>{ORDER_STATUS_LABELS[o.status as OrderStatus] ?? o.status}</Badge>
                        <Badge tone={o.paymentStatus === "paid" ? "success" : "neutral"}>
                          {PAYMENT_STATUS_LABELS[o.paymentStatus as PaymentStatus] ?? o.paymentStatus}
                        </Badge>
                      </div>
                      <p className="truncate text-small text-text-muted">
                        {formatDateTime(o.createdAt.toISOString())} · {o._count.items} món · gửi {o.recipientName}
                      </p>
                    </div>
                    <span className="font-bold tabular-nums">{formatVND(o.total)}</span>
                    <ChevronRight className="size-5 shrink-0 text-text-muted" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-6">
          <section aria-labelledby="thong-tin" className="rounded-card bg-surface p-5 shadow-soft">
            <h2 id="thong-tin" className="mb-4 text-h3 font-bold">
              Thông tin cá nhân
            </h2>
            <ProfileForm user={user} />
          </section>
          <section aria-labelledby="doi-mat-khau" className="rounded-card bg-surface p-5 shadow-soft">
            <h2 id="doi-mat-khau" className="mb-4 text-h3 font-bold">
              Đổi mật khẩu
            </h2>
            <ChangePasswordForm />
          </section>
        </div>
      </div>
    </div>
  );
}
