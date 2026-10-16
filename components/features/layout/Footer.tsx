import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { siteConfig } from "@/config/site.config";
import { NewsletterForm } from "../marketing/NewsletterForm";
import { Logo } from "./Logo";

const QUICK_LINKS = [
  { href: "/cua-hang", label: "Tất cả hộp quà" },
  { href: "/tu-thiet-ke", label: "Tự thiết kế hộp quà" },
  { href: "/tra-cuu-don-hang", label: "Tra cứu đơn hàng" },
  { href: "/huong-dan-mua-hang", label: "Hướng dẫn mua hàng" },
  { href: "/lien-he", label: "Liên hệ" },
];

const POLICY_LINKS = [
  { href: "/chinh-sach/doi-tra", label: "Đổi trả & hoàn tiền" },
  { href: "/chinh-sach/hang-loi", label: "Hàng lỗi, hư hỏng khi vận chuyển" },
  { href: "/chinh-sach/van-chuyen", label: "Chính sách vận chuyển" },
  { href: "/chinh-sach/bao-mat", label: "Bảo mật thông tin" },
];

const SOCIALS = [
  { href: siteConfig.contact.facebook, label: "Facebook" },
  { href: siteConfig.contact.instagram, label: "Instagram" },
  { href: siteConfig.contact.tiktok, label: "TikTok" },
  { href: siteConfig.contact.zalo, label: "Zalo" },
];

export function Footer() {
  const { contact } = siteConfig;
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="container-page grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.3fr] lg:py-16">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="max-w-xs text-small text-text-muted">
            Hộp quà kraft gói tay, đựng bánh kẹo và những lời chúc riêng. MÓ giúp bạn nói thương theo cách thật xinh.
          </p>
          <ul className="flex flex-wrap gap-2 pr-14 md:pr-0" aria-label="Mạng xã hội">
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center rounded-full border border-secondary px-3 text-small font-medium text-text hover:bg-primary-soft"
                >
                  {s.label}
                  <span className="sr-only"> (mở tab mới)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label="Liên kết nhanh">
          <h2 className="mb-4 font-sans text-small font-bold tracking-[0.14em] text-text uppercase">Mua sắm</h2>
          <ul className="flex flex-col gap-2.5">
            {QUICK_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-small text-text-muted hover:text-primary hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Chính sách">
          <h2 className="mb-4 font-sans text-small font-bold tracking-[0.14em] text-text uppercase">Chính sách</h2>
          <ul className="flex flex-col gap-2.5">
            {POLICY_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-small text-text-muted hover:text-primary hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-6">
          <div>
            <h2 className="mb-4 font-sans text-small font-bold tracking-[0.14em] text-text uppercase">Liên hệ</h2>
            <ul className="flex flex-col gap-2.5 text-small text-text-muted">
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <a href={`tel:${contact.hotlineTel}`} className="hover:text-primary">
                  Hotline: {contact.hotline}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <a href={`mailto:${contact.email}`} className="hover:text-primary">
                  {contact.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{contact.address}</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{contact.workingHours}</span>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="mb-2 font-sans text-small font-bold tracking-[0.14em] text-text uppercase">Nhận ưu đãi</h2>
            <NewsletterForm compact />
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-1 py-5 text-caption text-text-muted sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} MÓ Gift Box. Bảo lưu mọi quyền.</p>
          <p>[[Tên hộ kinh doanh / doanh nghiệp · Mã số thuế]]</p>
        </div>
      </div>
    </footer>
  );
}
