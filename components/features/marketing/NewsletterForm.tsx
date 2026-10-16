"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Form";
import { postJSON } from "@/lib/api-client";
import { cn } from "@/lib/text";
import { newsletterSchema } from "@/lib/validation";

type Values = z.infer<typeof newsletterSchema>;

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(newsletterSchema), defaultValues: { email: "" } });

  const onSubmit = async (values: Values) => {
    setServerError(null);
    const res = await postJSON("/api/newsletter", values);
    if (res.ok) setDone(true);
    else setServerError(res.error);
  };

  if (done) {
    return (
      <p role="status" className="flex items-center gap-2 rounded-box bg-success-bg px-4 py-3 text-small font-medium text-success">
        <CircleCheck className="size-5 shrink-0" aria-hidden="true" />
        Cảm ơn bạn! MÓ sẽ gửi ưu đãi sớm nhất qua email nhé.
      </p>
    );
  }

  const error = errors.email?.message ?? serverError;
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-2">
      {!compact && <p className="text-small text-text-muted">Nhận mã giảm giá và gợi ý quà mỗi mùa lễ. Không spam, hứa đó!</p>}
      <div className={cn("flex gap-2", compact ? "flex-col sm:flex-row" : "flex-col sm:flex-row")}>
        <label htmlFor={compact ? "newsletter-footer" : "newsletter-home"} className="sr-only">
          Email nhận ưu đãi
        </label>
        <Input
          id={compact ? "newsletter-footer" : "newsletter-home"}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Email của bạn"
          invalid={Boolean(error)}
          aria-describedby={error ? "newsletter-error" : undefined}
          className={compact ? "h-11" : undefined}
          {...register("email")}
        />
        <Button type="submit" variant="secondary" size={compact ? "md" : "lg"} loading={isSubmitting} className="shrink-0">
          Đăng ký
        </Button>
      </div>
      {error && (
        <p id="newsletter-error" role="alert" className="text-small font-medium text-error">
          {error}
        </p>
      )}
    </form>
  );
}
