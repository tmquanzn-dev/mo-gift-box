import type { Metadata } from "next";
import { BoxBuilder } from "@/components/features/builder/BoxBuilder";
import { Breadcrumb } from "@/components/ui/Display";
import { listBoxItems } from "@/services/product.service";

export const metadata: Metadata = {
  title: "Tự thiết kế hộp quà",
  description: "Tự chọn kích thước hộp, từng món bánh kẹo, màu nơ, thiệp và lời chúc. MÓ gói tay theo đúng ý bạn.",
  alternates: { canonical: "/tu-thiet-ke" },
};

export default async function BuildYourBoxPage() {
  const items = await listBoxItems();
  return (
    <div className="container-page pt-6 pb-16">
      <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Tự thiết kế hộp quà" }]} />
      <div className="mt-4 mb-8 max-w-2xl">
        <h1 className="text-h1 font-bold">Tự thiết kế hộp quà</h1>
        <p className="mt-2 text-text-muted">Chọn hộp, chọn món, thêm lời chúc. Bạn quyết định từng chi tiết, MÓ lo phần gói thật xinh.</p>
      </div>
      <BoxBuilder items={items} />
    </div>
  );
}
