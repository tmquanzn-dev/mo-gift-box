import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge, PriceTag } from "@/components/ui/Display";
import { BADGES, COLOR_THEMES } from "@/lib/catalog";
import type { Product } from "@/types";
import { QuickAddButton } from "./QuickAddButton";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const soldOut = product.stock <= 0;
  return (
    <article className="group card-lift relative flex flex-col overflow-hidden rounded-card bg-surface shadow-soft">
      <div className="relative aspect-square overflow-hidden bg-surface-sunken">
        <Image
          src={product.images[0]}
          alt={`${product.name} – ảnh hộp quà`}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          {soldOut ? (
            <Badge tone="neutral">Hết hàng</Badge>
          ) : (
            product.badges.map((b) => (
              <Badge key={b} tone={BADGES[b].tone}>
                {BADGES[b].label}
              </Badge>
            ))
          )}
        </div>
        {!soldOut && (
          <div className="absolute right-2.5 bottom-2.5 z-10">
            <QuickAddButton product={product} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <h3 className="line-clamp-2 text-small font-semibold text-text sm:text-body">
          <Link href={`/san-pham/${product.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>
        <div className="mt-auto flex items-end justify-between gap-2">
          <PriceTag price={product.price} compareAtPrice={product.compareAtPrice} size="sm" />
          <span className="flex -space-x-1" aria-label={`Màu: ${product.colorThemes.map((c) => COLOR_THEMES[c].label).join(", ")}`}>
            {product.colorThemes.slice(0, 3).map((c) => (
              <span key={c} className="size-4 rounded-full ring-2 ring-surface" style={{ backgroundColor: COLOR_THEMES[c].swatch }} />
            ))}
          </span>
        </div>
      </div>
      <ArrowUpRight
        className="pointer-events-none absolute top-3 right-3 hidden size-9 rounded-full bg-surface p-2 text-primary opacity-0 shadow-soft transition-opacity group-hover:opacity-100 md:block"
        aria-hidden="true"
      />
    </article>
  );
}
