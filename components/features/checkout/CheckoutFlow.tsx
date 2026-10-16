"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Banknote, Landmark, PencilLine, ShieldCheck, ShoppingBag, TriangleAlert, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm, useWatch, type FieldPath } from "react-hook-form";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/Display";
import { Checkbox, Field, Input, RadioCard } from "@/components/ui/Form";
import { Spinner } from "@/components/ui/Spinner";
import { Stepper } from "@/components/ui/Stepper";
import { toast } from "@/components/ui/Toaster";
import { businessConfig, siteConfig } from "@/config/site.config";
import { postJSON } from "@/lib/api-client";
import { COLOR_THEMES, PAYMENT_METHOD_LABELS } from "@/lib/catalog";
import { diffDays, earliestPreferredDate, estimateDelivery, latestPreferredDate } from "@/lib/delivery";
import { formatDayLabel, formatDeliveryRange, formatVND } from "@/lib/format";
import { computeTotals } from "@/lib/pricing";
import { createSafeStorage } from "@/lib/safe-storage";
import { normalizeName } from "@/lib/text";
import { useSession } from "@/lib/use-session";
import { checkoutFormSchema, STEP_FIELDS, validateFullName, validatePhone, WARD_OTHER, type CheckoutFormValues } from "@/lib/validation";
import { getProvince, getWard, resolveZone, SHOP_PROVINCE_NAME } from "@/services/address.service";
import { useCartStore } from "@/store/cart.store";
import { BoxContentsSummary, CustomizationSummary } from "../order/CustomizationSummary";
import { AddressFields } from "./AddressFields";
import { CheckoutSummary } from "./CheckoutSummary";

const STEPS = ["Thông tin giao hàng", "Thanh toán", "Xem lại & xác nhận"];
const DRAFT_KEY = "mo-checkout-draft-v1";
const draftStorage = createSafeStorage("session");

const DEFAULT_VALUES: CheckoutFormValues = {
  customer: { fullName: "", phone: "", email: "" },
  recipientIsDifferent: false,
  recipient: { fullName: "", phone: "" },
  address: { provinceId: "", wardId: "", wardName: "", street: "", note: "" },
  preferredDate: "",
  hidePrice: false,
  express: false,
  paymentMethod: "cod",
};

function loadDraft(): CheckoutFormValues {
  try {
    const raw = draftStorage.getItem(DRAFT_KEY);
    if (typeof raw !== "string" || !raw) return DEFAULT_VALUES;
    const parsed = JSON.parse(raw) as Partial<CheckoutFormValues>;
    return {
      ...DEFAULT_VALUES,
      ...parsed,
      customer: { ...DEFAULT_VALUES.customer, ...parsed.customer },
      recipient: { ...DEFAULT_VALUES.recipient, ...parsed.recipient },
      address: { ...DEFAULT_VALUES.address, ...parsed.address },
    };
  } catch {
    return DEFAULT_VALUES;
  }
}

function ReviewBlock({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-border bg-surface p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-display text-h3 font-bold">{title}</h3>
        <button type="button" onClick={onEdit} className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-small font-semibold text-primary hover:bg-primary-soft">
          <PencilLine className="size-4" aria-hidden="true" />
          Sửa<span className="sr-only"> {title.toLowerCase()}</span>
        </button>
      </div>
      {children}
    </section>
  );
}

export function CheckoutFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const items = useCartStore((s) => s.items);
  const hydrated = useCartStore((s) => s.hydrated);
  const coupon = useCartStore((s) => s.coupon);
  const couponCode = useCartStore((s) => s.couponCode);
  const removeCoupon = useCartStore((s) => s.removeCoupon);
  const clearCart = useCartStore((s) => s.clear);
  const topRef = useRef<HTMLDivElement>(null);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [serverError, setServerError] = useState<{ message: string; code?: string } | null>(null);

  // Khôi phục thông tin đang nhập dở (nếu khách tải lại trang). Trên server luôn ra DEFAULT_VALUES,
  // nhưng form chỉ hiện sau khi giỏ hàng đã nạp (hydrated) nên HTML server/client vẫn khớp.
  const [initialValues] = useState(loadDraft);
  const methods = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: initialValues,
    mode: "onTouched",
  });
  const { register, control, trigger, setError, setValue, getValues, handleSubmit, formState } = methods;
  const { errors } = formState;

  // Đã đăng nhập: điền sẵn thông tin người đặt vào các ô còn trống (không ghi đè thứ khách đang nhập)
  const { user } = useSession();
  useEffect(() => {
    if (!user) return;
    const opts = { shouldDirty: true } as const;
    if (!getValues("customer.fullName")) setValue("customer.fullName", user.fullName, opts);
    if (!getValues("customer.phone") && user.phone) setValue("customer.phone", user.phone, opts);
    if (!getValues("customer.email")) setValue("customer.email", user.email, opts);
  }, [user, getValues, setValue]);

  const values = useWatch({ control });
  useEffect(() => {
    const id = setTimeout(() => draftStorage.setItem(DRAFT_KEY, JSON.stringify(values)), 300);
    return () => clearTimeout(id);
  }, [values]);

  const provinceId = values.address?.provinceId ?? "";
  const wardId = values.address?.wardId ?? "";
  const zone = resolveZone(provinceId, wardId);
  const express = Boolean(values.express) && zone === "noi-thanh";

  useEffect(() => {
    if (values.express && zone !== "noi-thanh") setValue("express", false);
  }, [zone, values.express, setValue]);

  const totals = useMemo(
    () =>
      computeTotals({
        lines: items.map((i) => ({ unitPrice: i.unitPrice, quantity: i.quantity, customization: i.customization })),
        coupon,
        couponCode,
        zone,
        express,
      }),
    [items, coupon, couponCode, zone, express],
  );
  const delivery = zone ? (values.preferredDate ? { from: values.preferredDate, to: values.preferredDate } : estimateDelivery(zone, express)) : null;

  /* ---------- Điều hướng giữa các bước (đồng bộ với ?buoc= để nút Back hoạt động) ---------- */
  const step = Math.min(3, Math.max(1, Number(searchParams.get("buoc")) || 1));

  const goTo = (next: number) => {
    setServerError(null);
    router.push(next === 1 ? "/thanh-toan" : `/thanh-toan?buoc=${next}`, { scroll: false });
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const validateStep1 = async (): Promise<boolean> => {
    const baseOk = await trigger(STEP_FIELDS[1] as unknown as FieldPath<CheckoutFormValues>[], { shouldFocus: true });
    const v = getValues();
    let ok = baseOk;
    const fail = (name: FieldPath<CheckoutFormValues>, message: string | null) => {
      if (!message) return;
      setError(name, { type: "manual", message }, { shouldFocus: ok });
      ok = false;
    };
    if (v.recipientIsDifferent) {
      fail("recipient.fullName", validateFullName(v.recipient.fullName, "tên người nhận"));
      fail("recipient.phone", validatePhone(v.recipient.phone));
    }
    if (v.address.wardId === WARD_OTHER && normalizeName(v.address.wardName).length < 2) fail("address.wardName", "Bạn nhập tên phường/xã nhé.");
    const z = resolveZone(v.address.provinceId, v.address.wardId);
    if (v.preferredDate && z) {
      const min = earliestPreferredDate(z, v.express && z === "noi-thanh");
      if (diffDays(min, v.preferredDate) < 0) fail("preferredDate", `Ngày sớm nhất MÓ có thể giao là ${formatDayLabel(min)}.`);
      if (diffDays(v.preferredDate, latestPreferredDate()) < 0) fail("preferredDate", `Bạn chỉ hẹn được trong ${businessConfig.delivery.maxPreferredDays} ngày tới.`);
    }
    return ok;
  };

  const next = async () => {
    if (step === 1 && !(await validateStep1())) return;
    if (step === 2 && !(await trigger("paymentMethod"))) return;
    goTo(step + 1);
  };

  // Vào thẳng bước 2/3 bằng URL mà thông tin chưa hợp lệ → quay về bước 1
  useEffect(() => {
    if (step === 1) return;
    validateStep1().then((ok) => {
      if (!ok) router.replace("/thanh-toan", { scroll: false });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Đặt hàng ---------- */
  const placeOrder = handleSubmit(async (form) => {
    setPlacing(true);
    setServerError(null);
    const res = await postJSON<{ code: string; total: number }>("/api/orders", {
      form,
      couponCode: couponCode ?? null,
      items: items.map((i) => ({
        kind: i.kind,
        productId: i.productId,
        quantity: i.quantity,
        colorTheme: i.colorTheme,
        customization: i.customization,
        box: i.box ? { sizeId: i.box.sizeId, items: i.box.items.map((b) => ({ itemId: b.itemId, quantity: b.quantity })) } : undefined,
      })),
    });
    if (res.ok) {
      setPlaced(true);
      draftStorage.removeItem(DRAFT_KEY);
      router.push(`/dat-hang-thanh-cong/${res.code}`);
      // Xoá giỏ sau khi đã chuyển trang để không nháy màn hình "giỏ trống"
      setTimeout(clearCart, 800);
      return;
    }
    setPlacing(false);
    if (res.fieldErrors) {
      for (const [path, message] of Object.entries(res.fieldErrors)) {
        if (path.startsWith("form.")) setError(path.slice(5) as FieldPath<CheckoutFormValues>, { type: "server", message });
      }
    }
    setServerError({ message: res.error, code: res.code });
    toast.error("Chưa đặt được hàng", { description: res.error });
  }, () => toast.error("Thông tin chưa đầy đủ", { description: "Bạn kiểm tra lại các bước trước giúp MÓ nhé." }));

  /* ---------- Trạng thái đặc biệt ---------- */
  if (placed) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center" role="status">
        <Spinner className="size-8 text-primary" />
        <p className="font-semibold">MÓ đang ghi nhận đơn hàng của bạn…</p>
      </div>
    );
  }
  if (!hydrated) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_400px]" aria-busy="true">
        <Skeleton className="h-[560px] rounded-card" />
        <Skeleton className="hidden h-96 rounded-card lg:block" />
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-7" aria-hidden="true" />}
        title="Giỏ hàng đang trống"
        description="Bạn chọn hộp quà trước rồi quay lại thanh toán nhé."
        action={<ButtonLink href="/cua-hang">Chọn quà ngay</ButtonLink>}
      />
    );
  }

  const province = getProvince(provinceId);
  const wardLabel = wardId === WARD_OTHER ? values.address?.wardName : getWard(provinceId, wardId)?.name;
  const minDate = earliestPreferredDate(zone, express);
  const maxDate = latestPreferredDate();

  return (
    <FormProvider {...methods}>
      <div ref={topRef} className="scroll-mt-24" />
      <Stepper steps={STEPS} current={step} onStepClick={goTo} className="mb-6" />
      <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-10">
        <div className="lg:order-2">
          <CheckoutSummary totals={totals} delivery={delivery} />
        </div>

        <form onSubmit={placeOrder} noValidate className="flex flex-col gap-6 lg:order-1">
          {/* BƯỚC 1 */}
          <div hidden={step !== 1} className="flex flex-col gap-6">
            <section className="flex flex-col gap-4 rounded-card bg-surface p-4 shadow-soft sm:p-6" aria-labelledby="buyer-title">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="buyer-title" className="font-display text-h3 font-bold">
                  Thông tin người đặt
                </h2>
                {!user && (
                  <p className="text-small text-text-muted">
                    Đã có tài khoản?{" "}
                    <Link href="/dang-nhap?next=/thanh-toan" className="font-semibold text-primary hover:underline">
                      Đăng nhập
                    </Link>{" "}
                    để lưu đơn vào lịch sử.
                  </p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Họ và tên" required error={errors.customer?.fullName?.message}>
                  {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} invalid={invalid} autoComplete="name" {...register("customer.fullName")} />}
                </Field>
                <Field label="Số điện thoại" required error={errors.customer?.phone?.message}>
                  {({ id, describedBy, invalid }) => (
                    <Input id={id} aria-describedby={describedBy} invalid={invalid} type="tel" inputMode="tel" autoComplete="tel" placeholder="0901234567" {...register("customer.phone")} />
                  )}
                </Field>
                <Field label="Email" optional hint="Để nhận xác nhận đơn hàng qua email." error={errors.customer?.email?.message} className="sm:col-span-2">
                  {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} invalid={invalid} type="email" inputMode="email" autoComplete="email" {...register("customer.email")} />}
                </Field>
              </div>
              <Checkbox {...register("recipientIsDifferent")} label="Người nhận khác người đặt" description="Gửi quà tặng bất ngờ đến địa chỉ của người nhận." />
              {values.recipientIsDifferent && (
                <div className="grid gap-4 rounded-box bg-surface-sunken/60 p-4 sm:grid-cols-2">
                  <Field label="Tên người nhận" required error={errors.recipient?.fullName?.message}>
                    {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} invalid={invalid} {...register("recipient.fullName")} />}
                  </Field>
                  <Field label="Số điện thoại người nhận" required error={errors.recipient?.phone?.message}>
                    {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} invalid={invalid} type="tel" inputMode="tel" {...register("recipient.phone")} />}
                  </Field>
                </div>
              )}
            </section>

            <section className="flex flex-col gap-4 rounded-card bg-surface p-4 shadow-soft sm:p-6" aria-labelledby="address-title">
              <h2 id="address-title" className="font-display text-h3 font-bold">
                Địa chỉ giao hàng
              </h2>
              <AddressFields />
              {zone && (
                <p className="rounded-box bg-primary-soft/70 p-3 text-small">
                  {zone === "noi-thanh" ? `Nội thành ${SHOP_PROVINCE_NAME}` : "Ngoại thành / tỉnh khác"} · Phí ship{" "}
                  <strong>{totals.shippingFee === 0 ? "miễn phí" : formatVND(totals.shippingFee ?? 0)}</strong> · Giao dự kiến{" "}
                  <strong>{formatDeliveryRange(estimateDelivery(zone, express))}</strong>
                </p>
              )}
            </section>

            <section className="flex flex-col gap-4 rounded-card bg-surface p-4 shadow-soft sm:p-6" aria-labelledby="delivery-title">
              <h2 id="delivery-title" className="font-display text-h3 font-bold">
                Tuỳ chọn giao quà
              </h2>
              <Field
                label="Ngày giao mong muốn"
                optional
                hint={zone ? `Sớm nhất ${formatDayLabel(minDate)}. Bỏ trống để MÓ giao sớm nhất có thể.` : "Chọn địa chỉ trước để biết ngày giao sớm nhất."}
                error={errors.preferredDate?.message}
              >
                {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} invalid={invalid} type="date" min={minDate} max={maxDate} {...register("preferredDate")} />}
              </Field>
              <Checkbox {...register("hidePrice")} label="Giấu giá trên hoá đơn" description="Phiếu giao hàng không in giá tiền – phù hợp khi gửi quà tặng." />
            </section>
          </div>

          {/* BƯỚC 2 */}
          <div hidden={step !== 2} className="flex flex-col gap-6">
            <section className="flex flex-col gap-4 rounded-card bg-surface p-4 shadow-soft sm:p-6" aria-labelledby="speed-title">
              <h2 id="speed-title" className="font-display text-h3 font-bold">
                Tốc độ giao hàng
              </h2>
              <Checkbox
                {...register("express")}
                disabled={zone !== "noi-thanh"}
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <Zap className="size-4 text-primary" aria-hidden="true" /> Giao nhanh trong ngày (+{formatVND(businessConfig.surcharges.expressDelivery)})
                  </span>
                }
                description={
                  zone === "noi-thanh"
                    ? `Đặt trước ${businessConfig.delivery.cutoffHour}:00, quà đến tay người nhận ngay trong ngày.`
                    : `Chỉ áp dụng cho khu vực nội thành ${SHOP_PROVINCE_NAME}.`
                }
              />
            </section>

            <section className="flex flex-col gap-4 rounded-card bg-surface p-4 shadow-soft sm:p-6" aria-labelledby="payment-title">
              <h2 id="payment-title" className="font-display text-h3 font-bold">
                Phương thức thanh toán
              </h2>
              <div className="flex flex-col gap-3" role="radiogroup" aria-labelledby="payment-title">
                <RadioCard
                  value="bank_transfer"
                  {...register("paymentMethod")}
                  icon={<Landmark className="size-5" aria-hidden="true" />}
                  label="Chuyển khoản ngân hàng (VietQR)"
                  description="Quét mã QR bằng app ngân hàng. Mã QR và nội dung chuyển khoản theo mã đơn hiện ngay sau khi đặt."
                />
                <RadioCard
                  value="cod"
                  {...register("paymentMethod")}
                  icon={<Banknote className="size-5" aria-hidden="true" />}
                  label="Thanh toán khi nhận hàng (COD)"
                  description="Người nhận trả tiền mặt cho shipper. Nếu bạn chọn giấu giá, MÓ sẽ gọi bạn để thống nhất cách thu tiền."
                />
              </div>
              {errors.paymentMethod && <p className="text-small font-medium text-error">{errors.paymentMethod.message}</p>}
              {values.paymentMethod === "bank_transfer" && (
                <div className="rounded-box border border-dashed border-secondary p-4 text-small">
                  <p className="font-semibold">Tài khoản nhận tiền</p>
                  <p className="text-text-muted">
                    {siteConfig.bank.bankName} · {siteConfig.bank.accountNumber} · {siteConfig.bank.accountName}
                  </p>
                  <p className="mt-1 text-text-muted">Nội dung chuyển khoản là mã đơn hàng (dạng MOyyMMddxxxx), MÓ xác nhận trong vòng [[30 phút]] giờ làm việc.</p>
                </div>
              )}
            </section>
          </div>

          {/* BƯỚC 3 */}
          <div hidden={step !== 3} className="flex flex-col gap-4">
            <ReviewBlock title="Sản phẩm" onEdit={() => router.push("/gio-hang")}>
              <ul className="flex flex-col divide-y divide-border">
                {items.map((item) => (
                  <li key={item.lineId} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="relative size-16 shrink-0 overflow-hidden rounded-box bg-surface-sunken">
                      <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">
                        {item.name} <span className="text-text-muted">×{item.quantity}</span>
                      </p>
                      <p className="text-caption text-text-muted">Màu {COLOR_THEMES[item.colorTheme]?.label}</p>
                      <BoxContentsSummary box={item.box} />
                      <CustomizationSummary customization={item.customization} className="mt-1" />
                    </div>
                  </li>
                ))}
              </ul>
            </ReviewBlock>
            <ReviewBlock title="Giao đến" onEdit={() => goTo(1)}>
              <div className="text-small">
                <p className="font-semibold">
                  {values.recipientIsDifferent ? values.recipient?.fullName : values.customer?.fullName} · {values.recipientIsDifferent ? values.recipient?.phone : values.customer?.phone}
                </p>
                <p className="text-text-muted">
                  {values.address?.street}, {wardLabel}, {province?.name}
                </p>
                {values.address?.note && <p className="mt-1 text-text-muted">Ghi chú: {values.address.note}</p>}
                <p className="mt-2 text-text-muted">
                  Người đặt: {values.customer?.fullName} · {values.customer?.phone}
                  {values.customer?.email ? ` · ${values.customer.email}` : ""}
                </p>
                {delivery && (
                  <p className="mt-1">
                    Giao {values.preferredDate ? "theo hẹn" : "dự kiến"}: <strong>{formatDeliveryRange(delivery)}</strong>
                    {express && " · Giao nhanh trong ngày"}
                  </p>
                )}
                {values.hidePrice && <p className="mt-1 text-text-muted">✓ Giấu giá trên hoá đơn</p>}
              </div>
            </ReviewBlock>
            <ReviewBlock title="Thanh toán" onEdit={() => goTo(2)}>
              <p className="text-small font-semibold">{values.paymentMethod ? PAYMENT_METHOD_LABELS[values.paymentMethod] : ""}</p>
              <p className="text-small text-text-muted">Tổng thanh toán: {formatVND(totals.total)}</p>
            </ReviewBlock>

            {serverError && (
              <div role="alert" className="flex items-start gap-3 rounded-card border border-error/40 bg-error-bg p-4 text-small text-error">
                <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <div className="flex flex-col gap-2">
                  <p className="font-semibold">{serverError.message}</p>
                  {serverError.code === "coupon" && (
                    <Button size="sm" variant="outline" onClick={() => { removeCoupon(); setServerError(null); }} className="w-fit">
                      Bỏ mã giảm giá và thử lại
                    </Button>
                  )}
                  {serverError.code === "stock" && (
                    <ButtonLink size="sm" variant="outline" href="/gio-hang" className="w-fit">
                      Cập nhật giỏ hàng
                    </ButtonLink>
                  )}
                </div>
              </div>
            )}
            <p className="flex items-start gap-2 text-caption text-text-muted">
              <ShieldCheck className="size-4 shrink-0 text-success" aria-hidden="true" />
              Bấm “Đặt hàng” nghĩa là bạn đồng ý với chính sách đổi trả, vận chuyển và bảo mật của MÓ. Thông tin của bạn chỉ dùng để giao quà.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            {step > 1 ? (
              <Button variant="ghost" onClick={() => goTo(step - 1)} leftIcon={<ArrowLeft className="size-4" aria-hidden="true" />}>
                Quay lại
              </Button>
            ) : (
              <ButtonLink href="/gio-hang" variant="ghost" leftIcon={<ArrowLeft className="size-4" aria-hidden="true" />}>
                Về giỏ hàng
              </ButtonLink>
            )}
            {step < 3 ? (
              <Button variant="secondary" size="lg" onClick={next} rightIcon={<ArrowRight className="size-5" aria-hidden="true" />}>
                {step === 1 ? "Tiếp tục: Thanh toán" : "Tiếp tục: Xem lại đơn"}
              </Button>
            ) : (
              <Button type="submit" size="lg" loading={placing} loadingText="Đang đặt hàng…">
                Đặt hàng · {formatVND(totals.total)}
              </Button>
            )}
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
