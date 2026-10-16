"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Form";
import { toast } from "@/components/ui/Toaster";
import { postJSON } from "@/lib/api-client";
import { setSessionUser, type ClientUser } from "@/lib/use-session";
import { changePasswordSchema, PASSWORD_MIN, profileSchema, type ChangePasswordValues, type ProfileValues } from "@/lib/validation";
import { applyServerErrors, PasswordInput } from "./AuthForms";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      loading={loading}
      leftIcon={<LogOut className="size-4" aria-hidden="true" />}
      onClick={async () => {
        setLoading(true);
        await postJSON("/api/auth/logout", {});
        setSessionUser(null);
        router.replace("/");
        router.refresh();
      }}
    >
      Đăng xuất
    </Button>
  );
}

export function ProfileForm({ user }: { user: ClientUser }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: user.fullName, phone: user.phone ?? "" },
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const res = await postJSON<{ user: ClientUser }>("/api/auth/profile", values, { method: "PATCH" });
    if (!res.ok) {
      setFormError(applyServerErrors(res, setError, ["fullName", "phone"]));
      return;
    }
    setSessionUser(res.user);
    reset({ fullName: res.user.fullName, phone: res.user.phone ?? "" });
    toast.success("Đã lưu thông tin");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Email" hint="Email dùng để đăng nhập, không đổi được.">
        {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={user.email} disabled readOnly />}
      </Field>
      <Field label="Họ và tên" required error={errors.fullName?.message}>
        {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} invalid={invalid} autoComplete="name" {...register("fullName")} />}
      </Field>
      <Field label="Số điện thoại" required error={errors.phone?.message}>
        {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} invalid={invalid} type="tel" inputMode="tel" autoComplete="tel" {...register("phone")} />}
      </Field>
      {formError && (
        <p role="alert" className="text-small font-medium text-error">
          {formError}
        </p>
      )}
      <Button type="submit" variant="secondary" loading={isSubmitting} disabled={!isDirty} className="self-start">
        Lưu thay đổi
      </Button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const res = await postJSON("/api/auth/password", values);
    if (!res.ok) {
      if (res.code === "wrong_password") setError("currentPassword", { message: res.error });
      else setFormError(applyServerErrors(res, setError, ["currentPassword", "newPassword", "confirmPassword"]));
      return;
    }
    reset();
    toast.success("Đã đổi mật khẩu", { description: "Các thiết bị khác đã được đăng xuất." });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Mật khẩu hiện tại" required error={errors.currentPassword?.message}>
        {({ id, describedBy, invalid }) => <PasswordInput id={id} aria-describedby={describedBy} invalid={invalid} autoComplete="current-password" {...register("currentPassword")} />}
      </Field>
      <Field label="Mật khẩu mới" required hint={`Ít nhất ${PASSWORD_MIN} ký tự, có cả chữ và số.`} error={errors.newPassword?.message}>
        {({ id, describedBy, invalid }) => <PasswordInput id={id} aria-describedby={describedBy} invalid={invalid} autoComplete="new-password" {...register("newPassword")} />}
      </Field>
      <Field label="Nhập lại mật khẩu mới" required error={errors.confirmPassword?.message}>
        {({ id, describedBy, invalid }) => <PasswordInput id={id} aria-describedby={describedBy} invalid={invalid} autoComplete="new-password" {...register("confirmPassword")} />}
      </Field>
      {formError && (
        <p role="alert" className="text-small font-medium text-error">
          {formError}
        </p>
      )}
      <Button type="submit" variant="secondary" loading={isSubmitting} className="self-start">
        Đổi mật khẩu
      </Button>
    </form>
  );
}
