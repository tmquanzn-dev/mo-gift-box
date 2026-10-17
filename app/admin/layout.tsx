import type { Metadata } from "next";
import { AdminHeader } from "@/components/features/admin/AdminClient";
import { getPendingSummary } from "@/services/order.service";
import { getCurrentUser } from "@/server/auth";

export const metadata: Metadata = {
  title: { default: "Quản trị", template: "%s · Quản trị MÓ" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Từng trang tự requireAdmin() để chuyển hướng; layout chỉ hiện thanh quản trị khi đúng là admin
  const user = await getCurrentUser();
  const isAdmin = user?.role === "admin";
  const summary = isAdmin ? await getPendingSummary() : null;
  return (
    <>
      {isAdmin && summary && <AdminHeader initial={summary} adminName={user.fullName} />}
      <div className="container-page pt-6 pb-16">{children}</div>
    </>
  );
}
