import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Camera, Gift, HandHeart, Quote, RefreshCcw, Truck } from "lucide-react";
import { CopyCodeButton } from "@/components/features/marketing/CopyCodeButton";
import { NewsletterForm } from "@/components/features/marketing/NewsletterForm";
import { CategoryCard } from "@/components/features/product/CategoryCard";
import { ProductCard } from "@/components/features/product/ProductCard";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/Display";
import { businessConfig } from "@/config/site.config";
import { describeCoupon } from "@/lib/coupon";
import { shopHref } from "@/lib/filters";
import { formatShortDate, formatVND } from "@/lib/format";
import { upcomingOccasion } from "@/lib/occasions";
import { getFeaturedCoupon } from "@/services/coupon.service";
import { getBestSellers, listOccasions } from "@/services/product.service";

const STEPS = [
  { title: "Chọn hộp", text: "Lọc theo dịp hoặc ngân sách, chọn hộp quà bạn ưng nhất.", image: "/images/steps/buoc-1.svg" },
  { title: "Cá nhân hoá", text: "Thêm tên người nhận, lời chúc và chọn mẫu thiệp.", image: "/images/steps/buoc-2.svg" },
  { title: "Thanh toán", text: "Chuyển khoản qua QR hoặc trả tiền khi nhận hàng.", image: "/images/steps/buoc-3.svg" },
  { title: "Nhận quà", text: "MÓ gói tay cẩn thận và giao tận tay người nhận.", image: "/images/steps/buoc-4.svg" },
];

const REASONS = [
  { icon: Camera, title: "Hình ảnh thật", text: "Ảnh chụp từ chính hộp quà MÓ gói. Bạn thấy gì, người nhận nhận đúng như vậy." },
  { icon: HandHeart, title: "Gói quà thủ công", text: "Từng nơ ruy băng, từng lớp giấy rơm đều do MÓ tự tay sắp xếp." },
  { icon: Truck, title: "Giao nhanh", text: `Nội thành ${businessConfig.delivery.innerCityDays.min}–${businessConfig.delivery.innerCityDays.max} ngày, có giao nhanh trong ngày khi bạn cần gấp.` },
  { icon: RefreshCcw, title: "Hỗ trợ đổi trả", text: "Hộp quà bị móp, hỏng khi giao? MÓ đổi mới cho bạn, không cần hỏi nhiều." },
];

export default async function HomePage() {
  const [occasions, bestSellers, coupon] = await Promise.all([listOccasions(), getBestSellers(8), getFeaturedCoupon()]);
  const upcoming = upcomingOccasion(occasions);
  const others = occasions.filter((o) => o.id !== upcoming?.occasion.id);

  return (
    <>
      {/* 1. Hero */}
      <section aria-labelledby="hero-title" className="container-page grid items-center gap-8 pt-6 pb-12 md:grid-cols-2 md:gap-12 md:pt-12 md:pb-20">
        <div className="flex flex-col gap-6">
          <p className="w-fit rounded-full bg-primary-soft px-4 py-1.5 text-small font-semibold text-primary">
            {upcoming ? `Mùa quà ${upcoming.occasion.shortName} đã đến 🎀` : "Hộp quà gói tay từ MÓ 🎀"}
          </p>
          <h1 id="hero-title" className="text-display font-bold text-text">
            Gói trọn yêu thương trong từng hộp quà
          </h1>
          <p className="max-w-lg text-body text-text-muted md:text-[1.0625rem]">
            Bánh ngọt, hoa khô và một tấm thiệp mang lời chúc của riêng bạn. MÓ gói tay từng hộp để món quà nhỏ chạm đến người thương.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/cua-hang" size="lg" rightIcon={<ArrowRight className="size-5" aria-hidden="true" />}>
              Chọn quà ngay
            </ButtonLink>
            <ButtonLink href="/tu-thiet-ke" size="lg" variant="outline">
              Tự thiết kế hộp quà
            </ButtonLink>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-small text-text-muted">
            <li>✓ Freeship đơn từ {formatVND(businessConfig.shipping.freeShippingThreshold)}</li>
            <li>✓ Không cần tạo tài khoản</li>
            <li>✓ Thiệp & lời chúc miễn phí</li>
          </ul>
        </div>
        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[32px] bg-surface shadow-lift md:aspect-[10/11]">
            <Image
              src="/images/hero.svg"
              alt="Hộp quà kraft MÓ buộc nơ hồng đặt trên nền kem"
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-4 left-4 hidden rounded-card bg-surface px-5 py-3 shadow-float sm:block">
            <p className="text-caption text-text-muted">Hộp quà chỉ từ</p>
            <p className="font-display text-h3 font-bold text-primary">{formatVND(businessConfig.budgets[0].max ?? 59_000)}</p>
          </div>
        </div>
      </section>

      {/* 2. Quà theo dịp */}
      <section aria-labelledby="occasion-title" className="container-page py-12 md:py-16">
        <SectionHeading
          id="occasion-title"
          eyebrow="Quà theo dịp"
          title="Dịp nào cũng có quà xinh"
          description="Chọn dịp bạn muốn tặng, MÓ đã chuẩn bị sẵn những hộp quà hợp nhất."
        />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {upcoming && (
            <CategoryCard occasion={upcoming.occasion} featured targetDate={`${upcoming.date}T00:00:00+07:00`} />
          )}
          {others.map((o) => (
            <CategoryCard key={o.id} occasion={o} />
          ))}
        </div>
        {upcoming && (
          <p className="mt-4 text-small text-text-muted">
            {upcoming.occasion.name} rơi vào ngày {formatShortDate(upcoming.date)}. Đặt trước để MÓ kịp gói và giao đúng hẹn nhé.
          </p>
        )}
      </section>

      {/* 3. Chọn quà theo ngân sách */}
      <section aria-labelledby="budget-title" className="bg-surface py-12 md:py-16">
        <div className="container-page">
          <SectionHeading id="budget-title" eyebrow="Theo ngân sách" title="Bạn muốn tặng quà tầm giá nào?" description="Bấm vào một mức giá, MÓ lọc sẵn những hộp quà vừa túi tiền." />
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {businessConfig.budgets.map((b, i) => (
              <li key={b.id} className={i === businessConfig.budgets.length - 1 ? "col-span-2 sm:col-span-1" : undefined}>
                <Link
                  href={shopHref({ budget: b.id })}
                  className="group card-lift flex h-full flex-col gap-1 rounded-card border-2 border-border bg-bg p-5 hover:border-primary"
                >
                  <span className="text-caption font-semibold tracking-wide text-text-muted uppercase">{b.max ? "Đến" : "Từ"}</span>
                  <span className="font-display text-h2 font-bold text-primary">{b.label}</span>
                  <span className="text-small text-text-muted">{b.hint}</span>
                  <ArrowRight className="mt-2 size-5 text-primary transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 4. Sản phẩm bán chạy */}
      <section aria-labelledby="bestseller-title" className="container-page py-12 md:py-16">
        <SectionHeading
          id="bestseller-title"
          eyebrow="Được chọn nhiều"
          title="Hộp quà bán chạy"
          action={
            <ButtonLink href={shopHref({ sort: "ban-chay" })} variant="ghost" rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}>
              Xem tất cả
            </ButtonLink>
          }
        />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {bestSellers.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 2} />
          ))}
        </div>
      </section>

      {/* 5. Banner ưu đãi */}
      {coupon && (
        <section aria-labelledby="promo-title" className="container-page py-6">
          <div className="relative overflow-hidden rounded-[32px] bg-primary px-6 py-10 text-on-dark md:px-12 md:py-14">
            <div className="absolute -top-16 -right-16 size-64 rounded-full bg-secondary/20" aria-hidden="true" />
            <div className="absolute -bottom-20 left-1/3 size-56 rounded-full bg-accent/20" aria-hidden="true" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <p className="mb-2 text-caption font-semibold tracking-[0.18em] text-secondary uppercase">Ưu đãi đang chạy</p>
                <h2 id="promo-title" className="text-h1 font-bold">
                  {describeCoupon(coupon)}
                </h2>
                <p className="mt-2 text-small text-on-dark/85">
                  {coupon.description}. Áp dụng đến hết {new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(coupon.endsAt))}, mỗi đơn dùng một mã.
                </p>
              </div>
              <CopyCodeButton code={coupon.code} />
            </div>
          </div>
        </section>
      )}

      {/* 6. Quy trình 4 bước */}
      <section aria-labelledby="steps-title" className="container-page py-12 md:py-16">
        <SectionHeading id="steps-title" eyebrow="Đơn giản thôi" title="Tặng quà chỉ với 4 bước" align="center" />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex flex-col items-center gap-3 rounded-card bg-surface p-6 text-center shadow-soft">
              <div className="relative size-28">
                <Image src={s.image} alt="" fill sizes="112px" />
              </div>
              <span className="flex size-9 items-center justify-center rounded-full bg-primary font-bold text-on-dark">{i + 1}</span>
              <h3 className="text-h3 font-semibold">{s.title}</h3>
              <p className="text-small text-text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 7. Lý do chọn MÓ */}
      <section aria-labelledby="why-title" className="bg-surface py-12 md:py-16">
        <div className="container-page">
          <SectionHeading id="why-title" eyebrow="Vì sao là MÓ" title="Món quà nhỏ, chăm chút lớn" />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {REASONS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex flex-col gap-3 rounded-card border border-border bg-bg p-6">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <h3 className="text-h3 font-semibold">{title}</h3>
                <p className="text-small text-text-muted">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 8. Đánh giá khách hàng – CHỈ KHUNG, chờ đánh giá thật */}
      <section aria-labelledby="review-title" className="container-page py-12 md:py-16">
        <SectionHeading id="review-title" eyebrow="Khách hàng nói gì" title="Những hộp quà đã đến tay người thương" />
        <ul className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <li key={i} className="flex flex-col gap-4 rounded-card border-2 border-dashed border-secondary bg-surface p-6">
              <Quote className="size-8 text-secondary" aria-hidden="true" />
              <p className="text-body text-text-muted italic">[Thay bằng đánh giá thật]</p>
              <div className="mt-auto flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-full bg-surface-sunken text-text-muted" aria-hidden="true">
                  <Gift className="size-5" />
                </span>
                <div>
                  <p className="text-small font-semibold text-text">[Tên khách hàng]</p>
                  <p className="text-caption text-text-muted">[Hộp quà đã mua]</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 9. Đăng ký nhận ưu đãi */}
      <section aria-labelledby="newsletter-title" className="container-page pb-16">
        <div className="grid items-center gap-6 rounded-[32px] bg-primary-soft px-6 py-10 md:grid-cols-2 md:px-12">
          <div>
            <h2 id="newsletter-title" className="text-h2 font-bold">
              Nhận ưu đãi trước mỗi mùa quà
            </h2>
            <p className="mt-2 text-text-muted">MÓ gửi mã giảm giá và gợi ý hộp quà mới, chỉ vài lần mỗi tháng.</p>
          </div>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
