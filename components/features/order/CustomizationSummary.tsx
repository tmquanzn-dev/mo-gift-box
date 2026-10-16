import { cn } from "@/lib/text";
import { getCardTemplate } from "@/services/content.service";
import type { CustomBoxSelection, Customization } from "@/types";

/** Tóm tắt phần cá nhân hoá – dùng ở giỏ hàng, bước xem lại, trang xác nhận và tra cứu đơn. */
export function CustomizationSummary({ customization, className }: { customization: Customization; className?: string }) {
  const card = getCardTemplate(customization.cardTemplateId);
  const extras = [customization.handwrittenCard && "Thiệp viết tay", customization.premiumWrap && "Gói cao cấp"].filter(Boolean);
  const empty = !customization.recipientName && !customization.message && !card && extras.length === 0;
  if (empty) return <p className={cn("text-caption text-text-muted italic", className)}>Chưa có lời chúc</p>;
  return (
    <dl className={cn("grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-caption text-text-muted", className)}>
      {customization.recipientName && (
        <>
          <dt>Người nhận:</dt>
          <dd className="font-medium text-text">{customization.recipientName}</dd>
        </>
      )}
      {customization.message && (
        <>
          <dt>Lời chúc:</dt>
          <dd className="text-text whitespace-pre-line">“{customization.message}”</dd>
        </>
      )}
      {card && (
        <>
          <dt>Thiệp:</dt>
          <dd className="text-text">{card.name}</dd>
        </>
      )}
      {extras.length > 0 && (
        <>
          <dt>Thêm:</dt>
          <dd className="text-text">{extras.join(", ")}</dd>
        </>
      )}
    </dl>
  );
}

export function BoxContentsSummary({ box }: { box?: CustomBoxSelection | null }) {
  if (!box) return null;
  return <p className="text-caption text-text-muted">Gồm: {box.items.map((b) => `${b.name} ×${b.quantity}`).join(", ")}</p>;
}
