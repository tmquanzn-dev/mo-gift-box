"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { forwardRef, useState, type ComponentProps } from "react";
import { useForm, type FieldValues, type Path, type UseFormSetError } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Form";
import { toast } from "@/components/ui/Toaster";
import { postJSON, type ApiResult } from "@/lib/api-client";
import { setSessionUser, type ClientUser } from "@/lib/use-session";
import { loginSchema, PASSWORD_MIN, registerSchema, type LoginValues, type RegisterValues } from "@/lib/validation";

/** Ô mật khẩu có nút hiện/ẩn. */
export const PasswordInput = forwardRef<HTMLInputElement, Omit<ComponentProps<typeof Input>, "type">>(function PasswordInput(props, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input ref={ref} type={visible ? "text" : "password"} className="pr-12" {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        data-tooltip={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        data-tooltip-side="top"
        aria-pressed={visible}
        className="absolute top-1/2 right-1.5 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-text-muted hover:bg-primary-soft hover:text-primary"
      >
        {visible ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
      </button>
    </div>
  );
});

/** Gắn lỗi từng ô do server trả về vào form; lỗi chung trả về để hiện phía trên nút. */
export function applyServerErrors<T extends FieldValues>(res: Extract<ApiResult<unknown>, { ok: false }>, setError: UseFormSetError<T>, fields: Path<T>[]): string | null {
  let placed = false;
  for (const [key, message] of Object.entries(res.fieldErrors ?? {})) {
    if ((fields as string[]).includes(key)) {
      setError(key as Path<T>, { message });
      placed = true;
    }
  }
  if (res.code === "email_taken" && (fields as string[]).includes("email")) {
    setError("email" as Path<T>, { message: res.error });
    return null;
  }
  if (res.code === "phone_taken" && (fields as string[]).includes("phone")) {
    setError("phone" as Path<T>, { message: res.error });
    return null;
  }
  return placed ? null : res.error;
}

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { identifier: "", password: "" }, mode: "onTouched" });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const res = await postJSON<{ user: ClientUser }>("/api/auth/login", values);
    if (!res.ok) {
      setFormError(applyServerErrors(res, setError, ["identifier", "password"]));
      return;
    }
    setSessionUser(res.user);
    toast.success(`Chào ${res.user.fullName}!`);
    // Quản trị viên luôn vào thẳng trang quản trị (trừ khi đang được đưa về một trang quản trị cụ thể)
    router.replace(res.user.role === "admin" && !next.startsWith("/admin") ? "/admin" : next);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Email hoặc số điện thoại" required error={errors.identifier?.message}>
        {({ id, describedBy, invalid }) => (
          <Input id={id} aria-describedby={describedBy} invalid={invalid} autoComplete="username" autoFocus placeholder="ban@gmail.com hoặc 0901234567" {...register("identifier")} />
        )}
      </Field>
      <Field label="Mật khẩu" required error={errors.password?.message}>
        {({ id, describedBy, invalid }) => <PasswordInput id={id} aria-describedby={describedBy} invalid={invalid} autoComplete="current-password" {...register("password")} />}
      </Field>
      {formError && (
        <p role="alert" className="rounded-box bg-error-bg px-4 py-3 text-small font-medium text-error">
          {formError}
        </p>
      )}
      <Button type="submit" size="lg" fullWidth loading={isSubmitting} loadingText="Đang đăng nhập…">
        Đăng nhập
      </Button>
      <p className="text-center text-small text-text-muted">
        Chưa có tài khoản?{" "}
        <Link href={`/dang-ky${next !== "/tai-khoan" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-primary hover:underline">
          Đăng ký ngay
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ next }: { next: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", phone: "", password: "", confirmPassword: "" },
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const res = await postJSON<{ user: ClientUser }>("/api/auth/register", values);
    if (!res.ok) {
      setFormError(applyServerErrors(res, setError, ["fullName", "email", "phone", "password", "confirmPassword"]));
      return;
    }
    setSessionUser(res.user);
    toast.success("Tạo tài khoản thành công", { description: "Chào mừng bạn đến với MÓ!" });
    router.replace(next);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Họ và tên" required error={errors.fullName?.message}>
        {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} invalid={invalid} autoComplete="name" autoFocus {...register("fullName")} />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" required error={errors.email?.message}>
          {({ id, describedBy, invalid }) => (
            <Input id={id} aria-describedby={describedBy} invalid={invalid} type="email" inputMode="email" autoComplete="email" placeholder="ban@gmail.com" {...register("email")} />
          )}
        </Field>
        <Field label="Số điện thoại" required error={errors.phone?.message}>
          {({ id, describedBy, invalid }) => (
            <Input id={id} aria-describedby={describedBy} invalid={invalid} type="tel" inputMode="tel" autoComplete="tel" placeholder="0901234567" {...register("phone")} />
          )}
        </Field>
      </div>
      <Field label="Mật khẩu" required hint={`Ít nhất ${PASSWORD_MIN} ký tự, có cả chữ và số.`} error={errors.password?.message}>
        {({ id, describedBy, invalid }) => <PasswordInput id={id} aria-describedby={describedBy} invalid={invalid} autoComplete="new-password" {...register("password")} />}
      </Field>
      <Field label="Nhập lại mật khẩu" required error={errors.confirmPassword?.message}>
        {({ id, describedBy, invalid }) => <PasswordInput id={id} aria-describedby={describedBy} invalid={invalid} autoComplete="new-password" {...register("confirmPassword")} />}
      </Field>
      {formError && (
        <p role="alert" className="rounded-box bg-error-bg px-4 py-3 text-small font-medium text-error">
          {formError}
        </p>
      )}
      <Button type="submit" size="lg" fullWidth loading={isSubmitting} loadingText="Đang tạo tài khoản…">
        Tạo tài khoản
      </Button>
      <p className="text-center text-caption text-text-muted">
        Khi đăng ký, bạn đồng ý với{" "}
        <Link href="/chinh-sach/bao-mat" className="underline hover:text-primary">
          chính sách bảo mật
        </Link>{" "}
        của MÓ.
      </p>
      <p className="text-center text-small text-text-muted">
        Đã có tài khoản?{" "}
        <Link href={`/dang-nhap${next !== "/tai-khoan" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-primary hover:underline">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
