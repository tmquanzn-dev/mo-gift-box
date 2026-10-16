"use client";

import { Check, Sparkles } from "lucide-react";
import { useId, useState } from "react";
import { CharCounter, Checkbox, Field, Input, Textarea } from "@/components/ui/Form";
import { businessConfig } from "@/config/site.config";
import { formatVND } from "@/lib/format";
import { cn, normalizeMessage, normalizeName } from "@/lib/text";
import { customizationSchema } from "@/lib/validation";
import { getCardTemplate, listCardTemplates, messageSuggestions } from "@/services/content.service";
import type { Customization } from "@/types";
import { CardPreview } from "./CardPreview";

const { recipientNameMax, messageMax } = businessConfig.customization;

/** Trả về lỗi theo từng trường, hoặc {} nếu hợp lệ. */
export function validateCustomization(value: Customization): Partial<Record<keyof Customization, string>> {
  const result = customizationSchema.safeParse(value);
  if (result.success) return {};
  const errors: Partial<Record<keyof Customization, string>> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof Customization;
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

/** Chuẩn hoá trước khi lưu vào giỏ: gom khoảng trắng thừa. */
export function cleanCustomization(value: Customization): Customization {
  return { ...value, recipientName: normalizeName(value.recipientName), message: normalizeMessage(value.message) };
}

interface CustomizationFieldsProps {
  value: Customization;
  onChange: (value: Customization) => void;
  occasions?: string[];
  /** Hiện lỗi ngay cả khi người dùng chưa chạm vào ô (sau khi bấm thêm vào giỏ) */
  showErrors?: boolean;
  layout?: "stacked" | "split";
}

export function CustomizationFields({ value, onChange, occasions = [], showErrors = false, layout = "stacked" }: CustomizationFieldsProps) {
  const id = useId();
  const [touched, setTouched] = useState<Partial<Record<keyof Customization, boolean>>>({});
  const errors = validateCustomization(value);
  const errorFor = (key: keyof Customization) => (showErrors || touched[key] ? errors[key] : undefined);
  const set = <K extends keyof Customization>(key: K, v: Customization[K]) => onChange({ ...value, [key]: v });

  const templates = listCardTemplates();
  const sorted = [...templates].sort((a, b) => Number(!a.occasions.some((o) => occasions.includes(o))) - Number(!b.occasions.some((o) => occasions.includes(o))));
  const template = getCardTemplate(value.cardTemplateId) ?? sorted[0];
  const suggestions = messageSuggestions(occasions);
  const messageLength = normalizeMessage(value.message).length;
  const nameLength = normalizeName(value.recipientName).length;

  const preview = (
    <div className="flex flex-col gap-2">
      <p className="text-small font-semibold text-text">Xem trước thiệp</p>
      <CardPreview template={template} recipientName={normalizeName(value.recipientName)} message={normalizeMessage(value.message)} handwritten={value.handwrittenCard} />
      <p className="text-caption text-text-muted">
        {value.handwrittenCard ? "MÓ sẽ viết tay lời chúc này lên thiệp." : "Lời chúc được in lên thiệp theo mẫu bạn chọn."}
      </p>
    </div>
  );

  return (
    <div className={cn("grid gap-5", layout === "split" && "md:grid-cols-2 md:gap-8")}>
      <div className="flex flex-col gap-5">
        <Field label="Tên người nhận" optional error={errorFor("recipientName")} aside={<CharCounter current={nameLength} max={recipientNameMax} />}>
          {({ id: inputId, describedBy, invalid }) => (
            <Input
              id={inputId}
              aria-describedby={describedBy}
              invalid={invalid}
              value={value.recipientName}
              maxLength={recipientNameMax + 10}
              placeholder="Ví dụ: Mẹ yêu, cô Lan, Bé Na"
              onChange={(e) => set("recipientName", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, recipientName: true }))}
            />
          )}
        </Field>

        <Field label="Lời chúc" optional error={errorFor("message")} aside={<CharCounter current={messageLength} max={messageMax} />}>
          {({ id: inputId, describedBy, invalid }) => (
            <Textarea
              id={inputId}
              aria-describedby={describedBy}
              invalid={invalid}
              value={value.message}
              maxLength={messageMax + 30}
              rows={4}
              placeholder="Viết đôi lời gửi người nhận…"
              onChange={(e) => set("message", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, message: true }))}
            />
          )}
        </Field>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-small font-semibold text-text">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            Gợi ý lời chúc
          </p>
          <ul className="flex flex-col gap-2">
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => set("message", s)}
                  className="w-full rounded-box border border-border bg-surface px-3 py-2 text-left text-small text-text hover:border-secondary hover:bg-primary-soft"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <fieldset>
          <legend className="mb-2 text-small font-semibold text-text">Mẫu thiệp</legend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 md:grid-cols-3 lg:grid-cols-6">
            {sorted.map((t) => {
              const checked = template.id === t.id;
              return (
                <label key={t.id} className="group relative cursor-pointer rounded-box has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-primary/25">
                  <input type="radio" name={`${id}-card`} value={t.id} checked={checked} onChange={() => set("cardTemplateId", t.id)} className="sr-only" />
                  <CardPreview template={t} size="sm" className={cn("border-2 transition-colors", checked ? "border-primary" : "border-transparent group-hover:border-secondary")} />
                  {checked && (
                    <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-on-dark">
                      <Check className="size-3" aria-hidden="true" />
                    </span>
                  )}
                  <span className="sr-only">{t.name}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {layout === "stacked" && preview}

        <div className="flex flex-col gap-3 rounded-box bg-surface-sunken/60 p-4">
          <Checkbox
            checked={value.handwrittenCard}
            onChange={(e) => set("handwrittenCard", e.target.checked)}
            label={`Thiệp viết tay (+${formatVND(businessConfig.surcharges.handwrittenCard)})`}
            description="MÓ viết tay lời chúc bằng bút mực, ấm áp hơn bản in."
          />
          <Checkbox
            checked={value.premiumWrap}
            onChange={(e) => set("premiumWrap", e.target.checked)}
            label={`Gói quà cao cấp (+${formatVND(businessConfig.surcharges.premiumWrap)})`}
            description="Thêm giấy lụa, ruy băng vải và hoa khô trang trí trên nắp."
          />
        </div>
      </div>
      {layout === "split" && <div className="md:sticky md:top-24 md:self-start">{preview}</div>}
    </div>
  );
}
