"use client";

import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { PackageSearch, SearchX } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/Display";
import { Field, Input } from "@/components/ui/Form";
import { postJSON } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import { ORDER_CODE_PATTERN, normalizeOrderCode } from "@/lib/order-code";
import { phoneField } from "@/lib/validation";
import type { Order } from "@/types";
import { BankTransferBox, OrderItemsList, OrderMoney, OrderShippingInfo, OrderTimeline } from "./OrderDetails";

const schema = z.object({
  code: z.string().refine((v) => ORDER_CODE_PATTERN.test(normalizeOrderCode(v)), { message: "Mã đơn gồm chữ MO và 10 chữ số, ví dụ MO2610150123." }),
  phone: phoneField,
});
type Values = z.infer<typeof schema>;

export function OrderLookup() {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { code: searchParams.get("ma") ?? "", phone: "" },
  });

  const onSubmit = async (values: Values) => {
    setNotFound(null);
    const res = await postJSON<{ order: Order }>("/api/orders/lookup", { code: normalizeOrderCode(values.code), phone: values.phone });
    if (res.ok) {
      setOrder(res.order);
    } else {
      setOrder(null);
      setNotFound(res.error);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex h-fit flex-col gap-4 rounded-card bg-surface p-5 shadow-soft lg:sticky lg:top-24">
        <Field label="Mã đơn hàng" required error={errors.code?.message} hint="Mã có trong tin nhắn xác nhận, ví dụ MO2610150123.">
          {({ id, describedBy, invalid }) => (
            <Input id={id} aria-describedby={describedBy} invalid={invalid} autoCapitalize="characters" autoComplete="off" className="font-mono uppercase" {...register("code")} />
          )}
        </Field>
        <Field label="Số điện thoại đặt hàng hoặc nhận hàng" required error={errors.phone?.message}>
          {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} invalid={invalid} type="tel" inputMode="tel" autoComplete="tel" {...register("phone")} />}
        </Field>
        <Button type="submit" variant="secondary" size="lg" loading={isSubmitting} leftIcon={<PackageSearch className="size-5" aria-hidden="true" />}>
          Tra cứu
        </Button>
      </form>

      <div aria-live="polite">
        {isSubmitting && (
          <div className="flex flex-col gap-4" aria-busy="true">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-72 rounded-card" />
          </div>
        )}
        {!isSubmitting && notFound && (
          <EmptyState icon={<SearchX className="size-7" aria-hidden="true" />} title="Không tìm thấy đơn hàng" description={notFound} />
        )}
        {!isSubmitting && !notFound && !order && (
          <EmptyState
            icon={<PackageSearch className="size-7" aria-hidden="true" />}
            title="Theo dõi hộp quà của bạn"
            description="Nhập mã đơn và số điện thoại để xem quà đang ở bước nào: đã đặt, đã xác nhận, đang chuẩn bị, đang giao hay đã giao."
          />
        )}
        {!isSubmitting && order && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="font-display text-h2 font-bold">Đơn {order.code}</h2>
              <p className="text-small text-text-muted">Đặt lúc {formatDateTime(order.createdAt)}</p>
            </div>
            <section aria-label="Trạng thái" className="rounded-card bg-surface p-5 shadow-soft">
              <OrderTimeline order={order} />
            </section>
            {order.paymentMethod === "bank_transfer" && order.paymentStatus === "unpaid" && order.status !== "cancelled" && <BankTransferBox order={order} />}
            <section aria-label="Sản phẩm" className="rounded-card bg-surface p-5 shadow-soft">
              <OrderItemsList order={order} />
              <div className="mt-5 border-t border-border pt-5">
                <OrderMoney order={order} />
              </div>
            </section>
            <section aria-label="Giao hàng" className="rounded-card bg-surface p-5 shadow-soft">
              <OrderShippingInfo order={order} />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
