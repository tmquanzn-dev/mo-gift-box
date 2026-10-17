import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/features/account/AuthForms";
import { getCurrentUser, safeNextPath } from "@/server/auth";

export const metadata: Metadata = {
  title: "Đăng nhập",
  robots: { index: false, follow: true },
  alternates: { canonical: "/dang-nhap" },
};

export default async function LoginPage({ searchParams }: PageProps<"/dang-nhap">) {
  const next = safeNextPath((await searchParams).next);
  const user = await getCurrentUser();
  if (user) redirect(user.role === "admin" && !next.startsWith("/admin") ? "/admin" : next);
  return (
    <div className="container-page flex justify-center pt-10 pb-16">
      <div className="w-full max-w-md rounded-card bg-surface p-6 shadow-soft sm:p-8">
        <h1 className="mb-1 text-h2 font-bold">Đăng nhập</h1>
        <p className="mb-6 text-small text-text-muted">Xem lại đơn đã đặt và thanh toán nhanh hơn với thông tin đã lưu.</p>
        <LoginForm next={next} />
      </div>
    </div>
  );
}
