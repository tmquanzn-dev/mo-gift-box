import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/features/marketing/ContactForm";
import { Breadcrumb } from "@/components/ui/Display";
import { siteConfig } from "@/config/site.config";

export const metadata: Metadata = {
  title: "Liên hệ",
  description: "Hotline, Zalo, Facebook và email của MÓ Gift Box. MÓ luôn sẵn sàng tư vấn quà cho bạn.",
  alternates: { canonical: "/lien-he" },
};

export default function ContactPage() {
  const { contact } = siteConfig;
  const channels = [
    { icon: Phone, label: "Hotline (bấm để gọi)", value: contact.hotline, href: `tel:${contact.hotlineTel}` },
    { icon: MessageCircle, label: "Zalo", value: "Chat với MÓ qua Zalo", href: contact.zalo, external: true },
    { icon: MessageCircle, label: "Facebook", value: "Nhắn tin Fanpage", href: contact.messenger, external: true },
    { icon: Mail, label: "Email", value: contact.email, href: `mailto:${contact.email}` },
  ];
  return (
    <div className="container-page pt-6 pb-16">
      <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Liên hệ" }]} />
      <div className="mt-4 mb-8 max-w-2xl">
        <h1 className="text-h1 font-bold">MÓ luôn ở đây nè</h1>
        <p className="mt-2 text-text-muted">Cần tư vấn chọn quà, đặt số lượng lớn hay hỏi về đơn hàng? Chọn kênh bạn thấy tiện nhất nhé.</p>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-3">
          {channels.map(({ icon: Icon, label, value, href, external }) => (
            <a
              key={label}
              href={href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="card-lift flex items-center gap-4 rounded-card bg-surface p-5 shadow-soft"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="flex flex-col">
                <span className="text-small text-text-muted">{label}</span>
                <span className="font-semibold text-text">{value}</span>
              </span>
              {external && <span className="sr-only">(mở tab mới)</span>}
            </a>
          ))}
          <div className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-soft text-small">
            <p className="flex items-start gap-3">
              <Clock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              <span>
                <span className="block font-semibold">Giờ làm việc</span>
                <span className="text-text-muted">{contact.workingHours}</span>
              </span>
            </p>
            <p className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              <span>
                <span className="block font-semibold">Địa chỉ</span>
                <span className="text-text-muted">{contact.address}</span>
              </span>
            </p>
          </div>
        </div>
        <section aria-labelledby="contact-form-title" className="rounded-card bg-surface p-5 shadow-soft sm:p-8">
          <h2 id="contact-form-title" className="mb-4 font-display text-h2 font-bold">
            Gửi lời nhắn cho MÓ
          </h2>
          <ContactForm />
        </section>
      </div>
    </div>
  );
}
