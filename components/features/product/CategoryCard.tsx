import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { shopHref } from "@/lib/filters";
import { cn } from "@/lib/text";
import type { Occasion } from "@/types";
import { Countdown } from "../marketing/Countdown";

export function CategoryCard({ occasion, featured = false, targetDate }: { occasion: Occasion; featured?: boolean; targetDate?: string }) {
  return (
    <Link
      href={shopHref({ occasions: [occasion.slug] })}
      className={cn(
        "group card-lift relative flex overflow-hidden rounded-card bg-surface shadow-soft",
        featured ? "col-span-2 flex-col sm:flex-row lg:row-span-2 lg:flex-col" : "flex-col",
      )}
    >
      <div className={cn("relative overflow-hidden bg-surface-sunken", featured ? "aspect-[4/3] sm:w-1/2 lg:w-full" : "aspect-[4/3]")}>
        <Image
          src={occasion.coverImage}
          alt={`Hộp quà dịp ${occasion.name}`}
          fill
          sizes={featured ? "(min-width: 1024px) 40vw, 100vw" : "(min-width: 1024px) 20vw, 50vw"}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        {featured && <span className="absolute top-3 left-3 rounded-full bg-accent-strong px-3 py-1 text-caption font-bold text-white">Dịp sắp tới</span>}
      </div>
      <div className={cn("flex flex-1 flex-col gap-1 p-4", featured && "justify-center gap-3 sm:p-6")}>
        <h3 className={cn("font-display font-bold text-text", featured ? "text-h2" : "text-h3")}>{featured ? occasion.name : occasion.shortName}</h3>
        <p className={cn("text-text-muted", featured ? "text-body" : "line-clamp-2 text-small")}>{occasion.description}</p>
        {featured && targetDate && <Countdown target={targetDate} label={`Còn bao lâu đến ${occasion.shortName}`} />}
        <span className="mt-auto inline-flex items-center gap-1 pt-2 text-small font-semibold text-primary">
          {featured ? "Chọn quà ngay" : "Xem quà"}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
