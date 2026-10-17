import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/features/admin/ProductForm";
import { formatDateTime } from "@/lib/format";
import { getProductForAdmin, listOccasions } from "@/services/product.service";
import { requireAdmin } from "@/server/admin-auth";

export async function generateMetadata({ params }: PageProps<"/admin/san-pham/[id]">): Promise<Metadata> {
  const product = await getProductForAdmin((await params).id);
  return { title: product ? `Sửa: ${product.name}` : "Sản phẩm" };
}

export default async function AdminEditProductPage({ params }: PageProps<"/admin/san-pham/[id]">) {
  const { id } = await params;
  await requireAdmin(`/admin/san-pham/${id}`);
  const [product, occasions] = await Promise.all([getProductForAdmin(id), listOccasions()]);
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/san-pham" className="inline-flex w-fit items-center gap-1 text-small font-semibold text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" /> Tất cả sản phẩm
      </Link>
      <div>
        <h1 className="text-h1 font-bold">{product.name}</h1>
        <p className="text-small text-text-muted">
          Cập nhật lần cuối {formatDateTime(product.updatedAt)} · Đã bán {product.soldCount}
        </p>
      </div>
      <ProductForm key={product.updatedAt} product={product} occasions={occasions.map((o) => ({ slug: o.slug, name: o.name }))} />
    </div>
  );
}
