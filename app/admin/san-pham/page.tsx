import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Badge, EmptyState } from "@/components/ui/Display";
import { Input } from "@/components/ui/Form";
import { formatVND } from "@/lib/format";
import { removeDiacritics } from "@/lib/text";
import { listProductsForAdmin } from "@/services/product.service";
import { requireAdmin } from "@/server/admin-auth";

export const metadata: Metadata = { title: "Sản phẩm" };

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/san-pham">) {
  await requireAdmin("/admin/san-pham");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const all = await listProductsForAdmin();
  const terms = removeDiacritics(q).split(/\s+/).filter(Boolean);
  const products = terms.length ? all.filter((p) => terms.every((t) => removeDiacritics(`${p.name} ${p.slug}`).includes(t))) : all;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h1 font-bold">Sản phẩm</h1>
        <ButtonLink href="/admin/san-pham/moi" variant="secondary" leftIcon={<Plus className="size-4" aria-hidden="true" />}>
          Thêm hộp quà
        </ButtonLink>
      </div>

      <form className="flex max-w-md gap-2" role="search">
        <label htmlFor="admin-product-q" className="sr-only">
          Tìm theo tên sản phẩm
        </label>
        <Input id="admin-product-q" name="q" defaultValue={q} placeholder="Tên sản phẩm" className="h-11" />
        <button type="submit" className="h-11 shrink-0 rounded-full bg-primary px-5 font-semibold text-on-dark">
          Tìm
        </button>
      </form>

      {products.length === 0 ? (
        <EmptyState title={q ? "Không tìm thấy sản phẩm" : "Chưa có sản phẩm nào"} description={q ? "Thử từ khoá khác nhé." : "Bấm “Thêm hộp quà” để tạo sản phẩm đầu tiên."} />
      ) : (
        <div className="overflow-x-auto rounded-card bg-surface shadow-soft">
          <table className="w-full min-w-[760px] text-left text-small">
            <thead className="border-b border-border text-text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Sản phẩm</th>
                <th scope="col" className="px-4 py-3 font-semibold">Giá</th>
                <th scope="col" className="px-4 py-3 font-semibold">Tồn kho</th>
                <th scope="col" className="px-4 py-3 font-semibold">Đã bán</th>
                <th scope="col" className="px-4 py-3 font-semibold">Hiển thị</th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  <span className="sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-primary-soft/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-box bg-surface-sunken">
                        {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="56px" className="object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/admin/san-pham/${p.id}`} className="font-semibold text-primary underline-offset-2 hover:underline">
                          {p.name}
                        </Link>
                        <span className="block truncate text-caption text-text-muted">/{p.slug}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums">
                    {formatVND(p.price)}
                    {p.compareAtPrice && <span className="block text-caption font-normal text-text-muted line-through">{formatVND(p.compareAtPrice)}</span>}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{p.stock <= 0 ? <Badge tone="error">Hết hàng</Badge> : p.stock}</td>
                  <td className="px-4 py-3 tabular-nums">{p.soldCount}</td>
                  <td className="px-4 py-3">{p.isActive ? <Badge tone="success">Đang bán</Badge> : <Badge tone="neutral">Đang ẩn</Badge>}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link href={`/admin/san-pham/${p.id}`} className="font-semibold text-primary hover:underline">
                      Sửa
                    </Link>
                    {p.isActive && (
                      <Link href={`/san-pham/${p.slug}`} target="_blank" className="ml-4 text-text-muted hover:underline">
                        Xem
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
