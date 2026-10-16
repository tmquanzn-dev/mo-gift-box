/** Nội dung tĩnh dùng chung client/server: mẫu thiệp, lời chúc gợi ý. */
import cardTemplates from "@/data/card-templates.json";
import suggestions from "@/data/message-suggestions.json";
import type { CardTemplate } from "@/types";

const templates = cardTemplates as CardTemplate[];

export function listCardTemplates(): CardTemplate[] {
  return templates;
}

export function getCardTemplate(id: string | null | undefined): CardTemplate | undefined {
  if (!id) return undefined;
  return templates.find((t) => t.id === id);
}

/** Đưa mẫu thiệp hợp với dịp của sản phẩm lên đầu. */
export function cardTemplatesForOccasions(occasions: string[]): CardTemplate[] {
  const score = (t: CardTemplate) => (t.occasions.some((o) => occasions.includes(o)) ? 0 : 1);
  return [...templates].sort((a, b) => score(a) - score(b));
}

export function messageSuggestions(occasions: string[]): string[] {
  const map = suggestions as Record<string, string[]>;
  const fromOccasions = occasions.flatMap((o) => map[o] ?? []);
  return fromOccasions.length > 0 ? fromOccasions.slice(0, 4) : map.chung;
}
