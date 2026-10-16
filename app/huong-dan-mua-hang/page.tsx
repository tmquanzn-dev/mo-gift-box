import type { Metadata } from "next";
import Image from "next/image";
import { Accordion } from "@/components/ui/Accordion";
import { ButtonLink } from "@/components/ui/Button";
import { Breadcrumb } from "@/components/ui/Display";
import { siteConfig } from "@/config/site.config";
import { FAQ_GROUPS } from "@/data/faq";

export const metadata: Metadata = {
  title: "Hướng dẫn mua hàng & câu hỏi thường gặp",
  description: "Các bước đặt hộp quà MÓ, cách thanh toán, phí vận chuyển, đổi trả và cá nhân hoá lời chúc.",
  alternates: { canonical: "/huong-dan-mua-hang" },
};

const GUIDE = [
  { title: "Chọn hộp quà", text: "Lọc theo dịp, theo ngân sách hoặc tìm theo tên. Bấm vào hộp quà để xem ảnh thật và những món bên trong.", image: "/images/steps/buoc-1.svg" },
  { title: "Cá nhân hoá", text: "Chọn chủ đề màu, nhập tên người nhận, lời chúc và chọn mẫu thiệp. Thiệp được xem trước ngay khi bạn gõ.", image: "/images/steps/buoc-2.svg" },
  { title: "Thanh toán", text: "Nhập địa chỉ giao, chọn chuyển khoản VietQR hoặc COD, xem lại đơn và bấm Đặt hàng. Không cần tạo tài khoản.", image: "/images/steps/buoc-3.svg" },
  { title: "Nhận quà", text: "MÓ gọi xác nhận, gói tay và giao tận nơi. Bạn theo dõi trạng thái ở trang Tra cứu đơn hàng.", image: "/images/steps/buoc-4.svg" },
];

export default function GuidePage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_GROUPS.flatMap((g) => g.items).map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
  return (
    <div className="container-page pt-6 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }} />
      <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Hướng dẫn mua hàng" }]} />
      <h1 className="mt-4 text-h1 font-bold">Hướng dẫn mua hàng</h1>
      <p className="mt-2 max-w-2xl text-text-muted">Đặt một hộp quà ở MÓ chỉ mất vài phút. Đây là những gì bạn cần biết.</p>

      <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {GUIDE.map((g, i) => (
          <li key={g.title} className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-soft">
            <div className="relative aspect-square w-full overflow-hidden rounded-box bg-bg">
              <Image src={g.image} alt={`Minh hoạ bước ${i + 1}: ${g.title}`} fill sizes="(min-width: 1024px) 25vw, 50vw" />
            </div>
            <p className="text-caption font-bold tracking-[0.16em] text-primary uppercase">Bước {i + 1}</p>
            <h2 className="font-sans text-h3 font-semibold">{g.title}</h2>
            <p className="text-small text-text-muted">{g.text}</p>
          </li>
        ))}
      </ol>

      <section aria-labelledby="faq-title" className="mt-16 grid gap-8 lg:grid-cols-[260px_1fr]">
        <div className="min-w-0">
          <h2 id="faq-title" className="text-h2 font-bold">
            Câu hỏi thường gặp
          </h2>
          <nav aria-label="Nhóm câu hỏi" className="mt-4">
            <ul className="scrollbar-none flex gap-2 overflow-x-auto lg:flex-col">
              {FAQ_GROUPS.map((g) => (
                <li key={g.id} className="shrink-0">
                  <a href={`#${g.id}`} className="block rounded-full border border-secondary bg-surface px-4 py-2 text-small font-medium hover:bg-primary-soft lg:rounded-box">
                    {g.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="flex min-w-0 flex-col gap-8">
          {FAQ_GROUPS.map((g) => (
            <div key={g.id} id={g.id} className="scroll-mt-24">
              <h3 className="mb-3 font-display text-h3 font-bold">{g.title}</h3>
              <Accordion items={g.items.map((item, i) => ({ id: `${g.id}-${i}`, title: item.q, content: <p>{item.a}</p> }))} />
            </div>
          ))}
          <div className="flex flex-col items-start gap-3 rounded-card bg-primary-soft p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold">Chưa tìm thấy câu trả lời? MÓ luôn sẵn sàng trò chuyện cùng bạn.</p>
            <div className="flex gap-2">
              <ButtonLink href="/lien-he" variant="secondary">
                Liên hệ MÓ
              </ButtonLink>
              <a href={`tel:${siteConfig.contact.hotlineTel}`} className="inline-flex h-11 items-center rounded-full px-4 font-semibold text-primary hover:bg-surface">
                Gọi {siteConfig.contact.hotline}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
