"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/Button";
import { CharCounter, Field, Input, Textarea } from "@/components/ui/Form";
import { postJSON } from "@/lib/api-client";
import { contactSchema } from "@/lib/validation";

type Values = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(contactSchema), defaultValues: { fullName: "", phone: "", email: "", message: "" }, mode: "onTouched" });
  const message = useWatch({ control, name: "message" });

  const onSubmit = async (values: Values) => {
    setServerError(null);
    const res = await postJSON("/api/contact", values);
    if (res.ok) {
      setSent(true);
      reset();
    } else setServerError(res.error);
  };

  if (sent) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 rounded-card bg-success-bg p-8 text-center text-success">
        <CircleCheck className="size-10" aria-hidden="true" />
        <p className="text-h3 font-semibold">MÓ đã nhận lời nhắn của bạn!</p>
        <p className="text-small">MÓ sẽ liên hệ lại trong giờ làm việc sớm nhất nhé.</p>
        <Button variant="ghost" onClick={() => setSent(false)}>
          Gửi lời nhắn khác
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Họ và tên" required error={errors.fullName?.message}>
          {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} invalid={invalid} autoComplete="name" {...register("fullName")} />}
        </Field>
        <Field label="Số điện thoại" required error={errors.phone?.message}>
          {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} invalid={invalid} type="tel" inputMode="tel" autoComplete="tel" {...register("phone")} />}
        </Field>
      </div>
      <Field label="Email" optional error={errors.email?.message}>
        {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} invalid={invalid} type="email" autoComplete="email" {...register("email")} />}
      </Field>
      <Field label="Nội dung" required error={errors.message?.message} aside={<CharCounter current={message?.length ?? 0} max={1000} />}>
        {({ id, describedBy, invalid }) => <Textarea id={id} aria-describedby={describedBy} invalid={invalid} rows={5} placeholder="Bạn cần MÓ hỗ trợ điều gì?" {...register("message")} />}
      </Field>
      {serverError && (
        <p role="alert" className="text-small font-medium text-error">
          {serverError}
        </p>
      )}
      <Button type="submit" variant="secondary" size="lg" loading={isSubmitting} className="self-start">
        Gửi lời nhắn
      </Button>
    </form>
  );
}
