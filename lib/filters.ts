import { businessConfig } from "@/config/site.config";
import type { ProductFilters, SortOption } from "@/types";
import { isColorTheme, isRecipient, SORT_OPTIONS } from "./catalog";

/** Tên tham số trên URL – tiếng Việt không dấu để link chia sẻ dễ đọc. */
export const FILTER_PARAMS = {
  occasions: "dip",
  budget: "gia",
  colors: "mau",
  recipients: "nguoi-nhan",
  sort: "sap-xep",
  q: "q",
} as const;

export const DEFAULT_SORT: SortOption = "ban-chay";

type ParamSource = URLSearchParams | Record<string, string | string[] | undefined>;

function readParam(source: ParamSource, key: string): string {
  if (source instanceof URLSearchParams) return source.get(key) ?? "";
  const value = source[key];
  return Array.isArray(value) ? value.join(",") : (value ?? "");
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function parseFilters(source: ParamSource): ProductFilters {
  const budget = readParam(source, FILTER_PARAMS.budget);
  const sort = readParam(source, FILTER_PARAMS.sort) as SortOption;
  return {
    occasions: splitList(readParam(source, FILTER_PARAMS.occasions)),
    budget: businessConfig.budgets.some((b) => b.id === budget) ? budget : null,
    colors: splitList(readParam(source, FILTER_PARAMS.colors)).filter(isColorTheme),
    recipients: splitList(readParam(source, FILTER_PARAMS.recipients)).filter(isRecipient),
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? sort : DEFAULT_SORT,
    q: readParam(source, FILTER_PARAMS.q).trim().slice(0, 80),
  };
}

export function filtersToSearchParams(filters: ProductFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.occasions.length) params.set(FILTER_PARAMS.occasions, filters.occasions.join(","));
  if (filters.budget) params.set(FILTER_PARAMS.budget, filters.budget);
  if (filters.colors.length) params.set(FILTER_PARAMS.colors, filters.colors.join(","));
  if (filters.recipients.length) params.set(FILTER_PARAMS.recipients, filters.recipients.join(","));
  if (filters.sort !== DEFAULT_SORT) params.set(FILTER_PARAMS.sort, filters.sort);
  if (filters.q) params.set(FILTER_PARAMS.q, filters.q);
  return params;
}

export function shopHref(partial: Partial<ProductFilters> = {}): string {
  const params = filtersToSearchParams({ ...EMPTY_FILTERS, ...partial });
  const qs = params.toString();
  return qs ? `/cua-hang?${qs}` : "/cua-hang";
}

export const EMPTY_FILTERS: ProductFilters = {
  occasions: [],
  budget: null,
  colors: [],
  recipients: [],
  sort: DEFAULT_SORT,
  q: "",
};

export function countActiveFilters(f: ProductFilters): number {
  return f.occasions.length + f.colors.length + f.recipients.length + (f.budget ? 1 : 0) + (f.q ? 1 : 0);
}

export function getBudget(id: string | null) {
  return businessConfig.budgets.find((b) => b.id === id) ?? null;
}
