"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Package, ShoppingBag, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/Display";
import { RadioCard } from "@/components/ui/Form";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { Stepper } from "@/components/ui/Stepper";
import { toast } from "@/components/ui/Toaster";
import { businessConfig, type BoxSizeId } from "@/config/site.config";
import { COLOR_THEMES } from "@/lib/catalog";
import { formatVND } from "@/lib/format";
import { useBottomBarOffset } from "@/lib/hooks";
import { lineSurchargePerUnit } from "@/lib/pricing";
import { cn } from "@/lib/text";
import { listCardTemplates } from "@/services/content.service";
import { EMPTY_CUSTOMIZATION, useCartStore } from "@/store/cart.store";
import type { BoxItem, ColorThemeId, Customization } from "@/types";
import { CustomizationSummary } from "../order/CustomizationSummary";
import { ColorThemePicker } from "../product/ColorThemePicker";
import { cleanCustomization, CustomizationFields, validateCustomization } from "../product/CustomizationFields";

const STEPS = ["Chọn kích thước", "Chọn món", "Màu & lời chúc", "Xem lại"];
const ALL_THEMES = Object.keys(COLOR_THEMES) as ColorThemeId[];

export function BoxBuilder({ items }: { items: BoxItem[] }) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const topRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState(1);
  const [sizeId, setSizeId] = useState<BoxSizeId>("vua");
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [colorTheme, setColorTheme] = useState<ColorThemeId>("kraft");
  const [customization, setCustomization] = useState<Customization>({ ...EMPTY_CUSTOMIZATION, cardTemplateId: listCardTemplates()[0]?.id ?? null });
  const [quantity, setQuantity] = useState(1);
  const [showErrors, setShowErrors] = useState(false);
  const [category, setCategory] = useState<string>("Tất cả");

  const size = businessConfig.boxBuilder.sizes.find((s) => s.id === sizeId)!;
  const itemMap = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const selected = Object.entries(picks)
    .filter(([, q]) => q > 0)
    .map(([id, q]) => ({ item: itemMap.get(id)!, quantity: q }))
    .filter((p) => p.item);
  const used = selected.reduce((s, p) => s + p.item.size * p.quantity, 0);
  const over = used > size.capacity;
  const itemsTotal = selected.reduce((s, p) => s + p.item.price * p.quantity, 0);
  const unitPrice = size.basePrice + itemsTotal;
  const total = (unitPrice + lineSurchargePerUnit(customization)) * quantity;
  const categories = ["Tất cả", ...new Set(items.map((i) => i.category))];

  const bottomBarRef = useRef<HTMLDivElement>(null);
  useBottomBarOffset(bottomBarRef);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const setPick = (item: BoxItem, q: number) => {
    const current = picks[item.id] ?? 0;
    const delta = (q - current) * item.size;
    if (q > current && used + delta > size.capacity) {
      toast.error("Hộp đầy rồi", { description: `${size.name} chứa tối đa ${size.capacity} ô. Bạn bớt một món hoặc chọn hộp lớn hơn nhé.` });
      return;
    }
    setPicks((p) => ({ ...p, [item.id]: Math.max(0, Math.min(q, item.stock)) }));
  };

  const canNext = step === 1 || (step === 2 && selected.length > 0 && !over) || step === 3;
  const next = () => {
    if (step === 2 && selected.length === 0) {
      toast.error("Hộp còn trống", { description: "Bạn chọn ít nhất một món cho hộp quà nhé." });
      return;
    }
    if (step === 3 && Object.keys(validateCustomization(customization)).length > 0) {
      setShowErrors(true);
      return;
    }
    setStep((s) => Math.min(4, s + 1));
  };

  const addToCart = (goCheckout: boolean) => {
    if (over || selected.length === 0) return;
    addItem({
      kind: "custom-box",
      productId: `custom-${size.id}`,
      slug: "tu-thiet-ke",
      name: `Hộp quà tự thiết kế – ${size.name}`,
      image: businessConfig.boxBuilder.image,
      quantity,
      maxQuantity: Math.min(...selected.map((p) => Math.floor(p.item.stock / p.quantity))),
      colorTheme,
      customization: cleanCustomization(customization),
      unitPrice,
      box: {
        sizeId: size.id,
        items: selected.map((p) => ({ itemId: p.item.id, name: p.item.name, quantity: p.quantity, price: p.item.price, size: p.item.size })),
      },
    });
    toast.success("Đã thêm hộp quà của bạn vào giỏ");
    if (goCheckout) router.push("/thanh-toan");
    else openDrawer();
  };

  const capacityMeter = (
    <div>
      <div className="mb-1.5 flex justify-between text-small">
        <span className="font-semibold">Sức chứa {size.name.toLowerCase()}</span>
        <span className={cn("tabular-nums", over ? "font-bold text-error" : "text-text-muted")}>
          {used}/{size.capacity} ô
        </span>
      </div>
      <ProgressBar value={used / size.capacity} label={`Đã dùng ${used} trên ${size.capacity} ô`} className={over ? "[&>div]:bg-error" : undefined} />
      {over && (
        <p role="alert" className="mt-2 flex items-center gap-1.5 text-small font-medium text-error">
          <TriangleAlert className="size-4" aria-hidden="true" />
          Vượt sức chứa {used - size.capacity} ô. Bớt món hoặc đổi sang hộp lớn hơn.
        </p>
      )}
    </div>
  );

  return (
    <div className="pb-28 lg:pb-0">
      <div ref={topRef} className="scroll-mt-24" />
      <Stepper steps={STEPS} current={step} onStepClick={setStep} className="mb-8" />

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          {step === 1 && (
            <section aria-labelledby="size-title">
              <h2 id="size-title" className="mb-4 font-display text-h2 font-bold">
                Chọn kích thước hộp
              </h2>
              <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-labelledby="size-title">
                {businessConfig.boxBuilder.sizes.map((s) => (
                  <RadioCard
                    key={s.id}
                    name="box-size"
                    value={s.id}
                    checked={sizeId === s.id}
                    onChange={() => setSizeId(s.id)}
                    icon={<Package className={cn(s.id === "nho" ? "size-5" : s.id === "vua" ? "size-6" : "size-7")} aria-hidden="true" />}
                    label={s.name}
                    description={
                      <>
                        {s.dimensions.length} × {s.dimensions.width} × {s.dimensions.height} cm
                        <br />
                        Chứa tối đa {s.capacity} ô · Giá nền {formatVND(s.basePrice)}
                      </>
                    }
                  />
                ))}
              </div>
              <p className="mt-4 text-small text-text-muted">Giá nền đã gồm hộp kraft, giấy rơm, nơ ruy băng và một tấm thiệp.</p>
            </section>
          )}

          {step === 2 && (
            <section aria-labelledby="items-title" className="flex flex-col gap-4">
              <h2 id="items-title" className="font-display text-h2 font-bold">
                Chọn món cho hộp quà
              </h2>
              <div className="lg:hidden">{capacityMeter}</div>
              <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4" role="tablist" aria-label="Nhóm món">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="tab"
                    aria-selected={category === c}
                    onClick={() => setCategory(c)}
                    className={cn("h-10 shrink-0 rounded-full border px-4 text-small font-medium", category === c ? "border-primary bg-primary text-on-dark" : "border-secondary bg-surface hover:bg-primary-soft")}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {items
                  .filter((i) => category === "Tất cả" || i.category === category)
                  .map((item) => {
                    const q = picks[item.id] ?? 0;
                    const wouldOverflow = used + item.size > size.capacity;
                    return (
                      <li key={item.id} className={cn("flex flex-col overflow-hidden rounded-card border-2 bg-surface transition-colors", q > 0 ? "border-primary" : "border-transparent shadow-soft")}>
                        <div className="relative aspect-square bg-surface-sunken">
                          <Image src={item.image} alt={item.name} fill sizes="(min-width: 640px) 25vw, 50vw" className="object-cover" />
                          {item.size > 1 && <span className="absolute top-2 left-2 rounded-full bg-surface/90 px-2 py-0.5 text-caption font-semibold">Chiếm {item.size} ô</span>}
                        </div>
                        <div className="flex flex-1 flex-col gap-2 p-3">
                          <div>
                            <h3 className="text-small font-semibold">{item.name}</h3>
                            <p className="text-caption text-text-muted">{item.description}</p>
                          </div>
                          <p className="font-bold tabular-nums">{formatVND(item.price)}</p>
                          <div className="mt-auto">
                            {q === 0 ? (
                              <Button size="sm" variant="outline" fullWidth onClick={() => setPick(item, 1)} disabled={item.stock <= 0} aria-label={`Thêm ${item.name}`}>
                                {item.stock <= 0 ? "Hết hàng" : wouldOverflow ? "Hộp đã đầy" : "Thêm"}
                              </Button>
                            ) : (
                              <QuantityStepper size="sm" min={0} max={item.stock} value={q} onChange={(v) => setPick(item, v)} label={`Số lượng ${item.name}`} className="w-full justify-between" />
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </section>
          )}

          {step === 3 && (
            <section aria-labelledby="style-title" className="flex flex-col gap-6">
              <h2 id="style-title" className="font-display text-h2 font-bold">
                Chủ đề màu, thiệp và lời chúc
              </h2>
              <ColorThemePicker options={ALL_THEMES} value={colorTheme} onChange={setColorTheme} label="Màu nơ & giấy gói" />
              <CustomizationFields value={customization} onChange={setCustomization} showErrors={showErrors} layout="split" />
            </section>
          )}

          {step === 4 && (
            <section aria-labelledby="review-title" className="flex flex-col gap-4">
              <h2 id="review-title" className="font-display text-h2 font-bold">
                Xem lại hộp quà của bạn
              </h2>
              <div className="rounded-card bg-surface p-5 shadow-soft">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <p className="font-semibold">
                    {size.name} · màu {COLOR_THEMES[colorTheme].label.toLowerCase()}
                  </p>
                  <button type="button" onClick={() => setStep(1)} className="text-small font-semibold text-primary hover:underline">
                    Đổi hộp
                  </button>
                </div>
                <ul className="flex flex-col divide-y divide-border text-small">
                  <li className="flex justify-between py-2">
                    <span>{size.name} (giá nền)</span>
                    <span className="tabular-nums">{formatVND(size.basePrice)}</span>
                  </li>
                  {selected.map((p) => (
                    <li key={p.item.id} className="flex justify-between py-2">
                      <span>
                        {p.item.name} <span className="text-text-muted">×{p.quantity}</span>
                      </span>
                      <span className="tabular-nums">{formatVND(p.item.price * p.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex justify-between gap-2 border-t border-border pt-3">
                  <button type="button" onClick={() => setStep(2)} className="text-small font-semibold text-primary hover:underline">
                    Sửa món
                  </button>
                  <span className="font-semibold tabular-nums">{formatVND(unitPrice)} / hộp</span>
                </div>
              </div>
              <div className="rounded-card bg-surface p-5 shadow-soft">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-semibold">Lời chúc & thiệp</p>
                  <button type="button" onClick={() => setStep(3)} className="text-small font-semibold text-primary hover:underline">
                    Sửa
                  </button>
                </div>
                <CustomizationSummary customization={cleanCustomization(customization)} className="text-small" />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-card bg-surface p-5 shadow-soft">
                <span className="font-semibold">Số lượng hộp</span>
                <QuantityStepper value={quantity} onChange={setQuantity} max={businessConfig.stock.maxQuantityPerLine} />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" size="lg" fullWidth onClick={() => addToCart(false)} leftIcon={<ShoppingBag className="size-5" aria-hidden="true" />}>
                  Thêm vào giỏ
                </Button>
                <Button size="lg" fullWidth onClick={() => addToCart(true)}>
                  Mua ngay · {formatVND(total)}
                </Button>
              </div>
            </section>
          )}

          {step < 4 && (
            <div className="mt-8 hidden justify-between lg:flex">
              <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 1} leftIcon={<ArrowLeft className="size-4" aria-hidden="true" />}>
                Quay lại
              </Button>
              <Button variant="secondary" size="lg" onClick={next} disabled={!canNext} rightIcon={<ArrowRight className="size-5" aria-hidden="true" />}>
                Tiếp tục
              </Button>
            </div>
          )}
        </div>

        {/* Tổng tiền luôn hiển thị: cột phải trên desktop */}
        <aside aria-label="Hộp quà của bạn" className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          <div className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-soft">
            <h2 className="font-display text-h3 font-bold">Hộp quà của bạn</h2>
            {capacityMeter}
            <ul className="flex flex-col gap-1 text-small">
              <li className="flex justify-between">
                <span className="text-text-muted">{size.name}</span>
                <span className="tabular-nums">{formatVND(size.basePrice)}</span>
              </li>
              {selected.map((p) => (
                <li key={p.item.id} className="flex justify-between">
                  <span className="text-text-muted">
                    {p.item.name} ×{p.quantity}
                  </span>
                  <span className="tabular-nums">{formatVND(p.item.price * p.quantity)}</span>
                </li>
              ))}
              {lineSurchargePerUnit(customization) > 0 && (
                <li className="flex justify-between">
                  <span className="text-text-muted">Phụ phí thiệp/gói</span>
                  <span className="tabular-nums">{formatVND(lineSurchargePerUnit(customization))}</span>
                </li>
              )}
            </ul>
            <div className="flex items-baseline justify-between border-t border-border pt-3">
              <span className="font-semibold">Tổng {quantity > 1 ? `(${quantity} hộp)` : ""}</span>
              <span className="text-h3 font-bold tabular-nums" aria-live="polite">
                {formatVND(total)}
              </span>
            </div>
          </div>
        </aside>
      </div>

      {/* Thanh tổng tiền + điều hướng cố định ở đáy trên mobile */}
      <div ref={bottomBarRef} className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-float backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          {step > 1 && (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)} aria-label="Quay lại bước trước" className="px-3">
              <ArrowLeft className="size-5" aria-hidden="true" />
            </Button>
          )}
          <div className="mr-auto">
            <p className="text-caption text-text-muted">
              {used}/{size.capacity} ô · Tổng
            </p>
            <p className="font-bold tabular-nums" aria-live="polite">
              {formatVND(total)}
            </p>
          </div>
          {step < 4 ? (
            <Button variant="secondary" onClick={next} disabled={!canNext} rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}>
              Tiếp tục
            </Button>
          ) : (
            <Button onClick={() => addToCart(true)}>Mua ngay</Button>
          )}
        </div>
      </div>
    </div>
  );
}
