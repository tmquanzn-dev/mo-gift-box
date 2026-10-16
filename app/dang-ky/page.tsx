import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/features/account/AuthForms";
import { getCurrentUser, safeNextPath } from "@/server/auth";

export const metadata: Metadata = {
  title: "Đăng ký tài khoản",
  robots: { index: false, follow: true },
  alternates: { canonical: "/dang-ky" },
};

export default async function RegisterPage({ searchParams }: PageProps<"/dang-ky">) {
  const next = safeNextPath((await searchParams).next);
  if (await getCurrentUser()) redirect(next);
  return (
    <div className="container-page flex justify-center pt-10 pb-16">
      <div className="w-full max-w-lg rounded-card bg-surface p-6 shadow-soft sm:p-8">
        <h1 className="mb-1 text-h2 font-bold">Tạo tài khoản MÓ</h1>
        <p className="mb-6 text-small text-text-muted">Lưu thông tin để đặt quà nhanh hơn và theo dõi mọi đơn hàng ở một nơi.</p>
        <RegisterForm next={next} />
      </div>
    </div>
  );
}
