import type { Metadata } from "next";
import { AdminNav } from "@/components/features/admin/AdminClient";

export const metadata: Metadata = {
  title: { default: "Quản trị", template: "%s · Quản trị MÓ" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="container-page pt-6 pb-16">
      <AdminNav />
      {children}
    </div>
  );
}
