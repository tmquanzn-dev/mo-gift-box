"use client";

import { usePathname, useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { createContext, useContext, useOptimistic, useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Display";
import { Select } from "@/components/ui/Form";
import { Drawer } from "@/components/ui/Overlay";
import { Spinner } from "@/components/ui/Spinner";
import { businessConfig } from "@/config/site.config";
import { COLOR_THEMES, RECIPIENTS, SORT_OPTIONS } from "@/lib/catalog";
import { countActiveFilters, EMPTY_FILTERS, filtersToSearchParams, getBudget } from "@/lib/filters";
import { cn } from "@/lib/text";
import type { ColorThemeId, Occasion, ProductFilters, RecipientId, SortOption } from "@/types";

interface ShopContextValue {
  filters: ProductFilters;
  update: (patch: Partial<ProductFilters>) => void;
  pending: boolean;
}

const ShopContext = createContext<ShopContextValue | null>(null);
const useShop = () => {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop phải nằm trong ShopShell");
  return ctx;
};

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-b border-border pb-5 last:border-0">
      <legend className="mb-3 text-small font-bold tracking-[0.12em] text-text uppercase">{title}</legend>
      {children}
    </fieldset>
  );
}

function CheckOption({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-box px-1 text-body text-text hover:text-primary">
      <input type="checkbox" checked={checked} onChange={onChange} className="size-5 shrink-0 cursor-pointer accent-primary" />
      {children}
    </label>
  );
}

function FilterControls({ occasions }: { occasions: Occasion[] }) {
  const { filters, update } = useShop();
  return (
    <div className="flex flex-col gap-5">
      <FilterGroup title="Dịp tặng">
        <div className="flex flex-col">
          {occasions.map((o) => (
            <CheckOption key={o.id} checked={filters.occasions.includes(o.slug)} onChange={() => update({ occasions: toggle(filters.occasions, o.slug) })}>
              {o.name}
            </CheckOption>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Khoảng giá">
        <div className="flex flex-col">
          {businessConfig.budgets.map((b) => (
            <label key={b.id} className="flex min-h-10 cursor-pointer items-center gap-3 rounded-box px-1 text-body text-text hover:text-primary">
              <input
                type="radio"
                name="budget"
                checked={filters.budget === b.id}
                onChange={() => update({ budget: b.id })}
                onClick={() => filters.budget === b.id && update({ budget: null })}
                className="size-5 shrink-0 cursor-pointer accent-primary"
              />
              {b.max ? `Đến ${b.label}` : b.label}
            </label>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Chủ đề màu">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(COLOR_THEMES) as ColorThemeId[]).map((id) => {
            const checked = filters.colors.includes(id);
            return (
              <label
                key={id}
                className={cn(
                  "flex h-10 cursor-pointer items-center gap-2 rounded-full border-2 bg-surface pr-3 pl-1 text-small font-medium has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-primary/20",
                  checked ? "border-primary" : "border-border hover:border-secondary",
                )}
              >
                <input type="checkbox" checked={checked} onChange={() => update({ colors: toggle(filters.colors, id) })} className="sr-only" />
                <span className="size-6 rounded-full" style={{ backgroundColor: COLOR_THEMES[id].swatch }} aria-hidden="true" />
                {COLOR_THEMES[id].label}
              </label>
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup title="Tặng cho">
        <div className="flex flex-col">
          {(Object.keys(RECIPIENTS) as RecipientId[]).map((id) => (
            <CheckOption key={id} checked={filters.recipients.includes(id)} onChange={() => update({ recipients: toggle(filters.recipients, id) })}>
              {RECIPIENTS[id]}
            </CheckOption>
          ))}
        </div>
      </FilterGroup>
    </div>
  );
}

function ActiveChips({ occasions }: { occasions: Occasion[] }) {
  const { filters, update } = useShop();
  if (countActiveFilters(filters) === 0) return null;
  const occasionName = (slug: string) => occasions.find((o) => o.slug === slug)?.shortName ?? slug;
  const budget = getBudget(filters.budget);
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Bộ lọc đang chọn">
      {filters.q && (
        <Chip onRemove={() => update({ q: "" })} removeLabel={`Bỏ từ khoá ${filters.q}`}>
          “{filters.q}”
        </Chip>
      )}
      {filters.occasions.map((slug) => (
        <Chip key={slug} onRemove={() => update({ occasions: filters.occasions.filter((o) => o !== slug) })} removeLabel={`Bỏ lọc dịp ${occasionName(slug)}`}>
          {occasionName(slug)}
        </Chip>
      ))}
      {budget && (
        <Chip onRemove={() => update({ budget: null })} removeLabel="Bỏ lọc khoảng giá">
          {budget.max ? `Đến ${budget.label}` : budget.label}
        </Chip>
      )}
      {filters.colors.map((c) => (
        <Chip key={c} onRemove={() => update({ colors: filters.colors.filter((x) => x !== c) })} removeLabel={`Bỏ lọc màu ${COLOR_THEMES[c].label}`}>
          Màu {COLOR_THEMES[c].label.toLowerCase()}
        </Chip>
      ))}
      {filters.recipients.map((r) => (
        <Chip key={r} onRemove={() => update({ recipients: filters.recipients.filter((x) => x !== r) })} removeLabel={`Bỏ lọc ${RECIPIENTS[r]}`}>
          {RECIPIENTS[r]}
        </Chip>
      ))}
      <button type="button" onClick={() => update({ ...EMPTY_FILTERS, sort: filters.sort })} className="h-9 rounded-full px-3 text-small font-semibold text-primary underline-offset-2 hover:underline">
        Xoá tất cả
      </button>
    </div>
  );
}

export function ShopShell({
  filters: serverFilters,
  occasions,
  total,
  title,
  children,
}: {
  filters: ProductFilters;
  occasions: Occasion[];
  total: number;
  title: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  // Cập nhật giao diện bộ lọc ngay lập tức, trong lúc server lọc lại sản phẩm
  const [filters, setOptimistic] = useOptimistic(serverFilters);
  const [sheetOpen, setSheetOpen] = useState(false);
  const active = countActiveFilters(filters);

  const update = (patch: Partial<ProductFilters>) => {
    const next = { ...filters, ...patch };
    startTransition(() => {
      setOptimistic(next);
      const qs = filtersToSearchParams(next).toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  return (
    <ShopContext.Provider value={{ filters, update, pending }}>
      <div className="container-page pb-16">
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="text-h1 font-bold">{title}</h1>
          <p className="text-text-muted" aria-live="polite">
            {pending ? "Đang lọc…" : `${total} hộp quà phù hợp`}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block" aria-label="Bộ lọc sản phẩm">
            <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-card bg-surface p-5 shadow-soft">
              <FilterControls occasions={occasions} />
            </div>
          </aside>

          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden"
                onClick={() => setSheetOpen(true)}
                leftIcon={<SlidersHorizontal className="size-4" aria-hidden="true" />}
              >
                Bộ lọc{active > 0 ? ` (${active})` : ""}
              </Button>
              <div className="ml-auto flex items-center gap-2">
                <label htmlFor="sort" className="hidden text-small text-text-muted sm:block">
                  Sắp xếp
                </label>
                <Select id="sort" value={filters.sort} onChange={(e) => update({ sort: e.target.value as SortOption })} className="h-10 w-44 text-small">
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <ActiveChips occasions={occasions} />

            <div className={cn("relative transition-opacity duration-200", pending && "pointer-events-none opacity-50")} aria-busy={pending}>
              {pending && (
                <div className="absolute top-8 left-1/2 z-10 -translate-x-1/2 rounded-full bg-surface p-3 shadow-lift">
                  <Spinner label="Đang tải sản phẩm" />
                </div>
              )}
              {children}
            </div>
          </div>
        </div>
      </div>

      <Drawer
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Bộ lọc"
        side="bottom"
        footer={
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => update({ ...EMPTY_FILTERS, sort: filters.sort })} disabled={active === 0}>
              Xoá tất cả
            </Button>
            <Button variant="secondary" fullWidth loading={pending} onClick={() => setSheetOpen(false)}>
              Xem {total} kết quả
            </Button>
          </div>
        }
      >
        <div className="px-5 py-4">
          <FilterControls occasions={occasions} />
        </div>
      </Drawer>
    </ShopContext.Provider>
  );
}
