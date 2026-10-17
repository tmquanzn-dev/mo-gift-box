import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/features/admin/ProductForm";
import { listOccasions } from "@/services/product.service";
import { requireAdmin } from "@/server/admin-auth";

export const metadata: Metadata = { title: "Thêm hộp quà" };

export default async function AdminNewProductPage() {
  await requireAdmin("/admin/san-pham/moi");
  const occasions = await listOccasions();
  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/san-pham" className="inline-flex w-fit items-center gap-1 text-small font-semibold text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" /> Tất cả sản phẩm
      </Link>
      <h1 className="text-h1 font-bold">Thêm hộp quà</h1>
      <ProductForm occasions={occasions.map((o) => ({ slug: o.slug, name: o.name }))} />
    </div>
  );
}
