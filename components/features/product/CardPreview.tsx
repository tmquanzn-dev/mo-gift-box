import { cn } from "@/lib/text";
import type { CardTemplate } from "@/types";

function Pattern({ template }: { template: CardTemplate }) {
  const c = template.accent;
  switch (template.pattern) {
    case "dots":
      return (
        <svg className="absolute inset-0 size-full opacity-40" aria-hidden="true">
          <pattern id={`p-${template.id}`} width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="2" fill={c} />
          </pattern>
          <rect width="100%" height="100%" fill={`url(#p-${template.id})`} />
        </svg>
      );
    case "stripes":
      return (
        <div
          className="absolute inset-x-0 top-0 h-6 opacity-70"
          style={{ background: `repeating-linear-gradient(45deg, ${c} 0 8px, transparent 8px 16px)` }}
          aria-hidden="true"
        />
      );
    case "hearts":
    case "flowers":
    case "snow": {
      const glyph = template.pattern === "hearts" ? "♥" : template.pattern === "snow" ? "❄" : "✿";
      const spots = [
        [8, 10, 22],
        [86, 14, 18],
        [12, 78, 16],
        [82, 82, 24],
        [50, 6, 12],
      ];
      return (
        <div className="absolute inset-0" aria-hidden="true">
          {spots.map(([x, y, s], i) => (
            <span key={i} className="absolute leading-none" style={{ left: `${x}%`, top: `${y}%`, fontSize: s, color: c, opacity: 0.7 }}>
              {glyph}
            </span>
          ))}
        </div>
      );
    }
    default:
      return <div className="absolute inset-3 rounded-box border border-dashed opacity-60" style={{ borderColor: c }} aria-hidden="true" />;
  }
}

/** Xem trước thiệp theo thời gian thực – cũng dùng làm ảnh nhỏ trong lưới chọn mẫu. */
export function CardPreview({
  template,
  recipientName,
  message,
  handwritten = false,
  size = "lg",
  className,
}: {
  template: CardTemplate;
  recipientName?: string;
  message?: string;
  handwritten?: boolean;
  size?: "sm" | "lg";
  className?: string;
}) {
  const small = size === "sm";
  return (
    <div
      className={cn("relative aspect-[4/3] w-full overflow-hidden rounded-box shadow-soft", !small && "rounded-card", className)}
      style={{ backgroundColor: template.background, color: template.ink }}
    >
      <Pattern template={template} />
      {!small && (
        <div className="relative flex h-full flex-col justify-center gap-2 px-[12%] py-[10%] text-center">
          <p className={cn("font-display text-h3 font-bold break-words", !recipientName && "opacity-50")}>{recipientName ? `Gửi ${recipientName},` : "Gửi người thương,"}</p>
          <p className={cn("text-small leading-relaxed whitespace-pre-line break-words sm:text-body", handwritten && "italic", !message && "opacity-50")}>
            {message || "Lời chúc của bạn sẽ hiện ở đây…"}
          </p>
          <p className="mt-1 font-display text-small italic opacity-80">— gói bằng cả tấm lòng</p>
        </div>
      )}
      {small && <span className="absolute inset-x-0 bottom-1 text-center text-[10px] font-semibold opacity-80">{template.name}</span>}
    </div>
  );
}
