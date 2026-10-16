/**
 * Dữ liệu địa giới hành chính – dùng chung cho client (dropdown) và server (tính khu vực giao).
 * Sau này có thể thay bằng API địa giới chính thức mà không đổi chữ ký hàm.
 */
import { businessConfig } from "@/config/site.config";
import data from "@/data/addresses.json";
import { WARD_OTHER } from "@/lib/validation";
import type { Province, ShippingZone, Ward } from "@/types";

const provinces = data.provinces as Province[];

export function listProvinces(): Pick<Province, "id" | "name">[] {
  return provinces.map(({ id, name }) => ({ id, name }));
}

export function getProvince(id: string): Province | undefined {
  return provinces.find((p) => p.id === id);
}

export function listWards(provinceId: string): Ward[] {
  return getProvince(provinceId)?.wards ?? [];
}

export function getWard(provinceId: string, wardId: string): Ward | undefined {
  return listWards(provinceId).find((w) => w.id === wardId);
}

/** Khu vực giao hàng: chỉ phường được đánh dấu "noi-thanh" tại tỉnh của shop mới là nội thành. */
export function resolveZone(provinceId: string, wardId: string | null | undefined): ShippingZone | null {
  if (!provinceId) return null;
  if (provinceId !== businessConfig.shipping.shopProvinceId) return "ngoai-thanh";
  if (!wardId) return null;
  if (wardId === WARD_OTHER) return "ngoai-thanh";
  return getWard(provinceId, wardId)?.zone ?? "ngoai-thanh";
}

export const SHOP_PROVINCE_NAME = getProvince(businessConfig.shipping.shopProvinceId)?.name ?? "";
