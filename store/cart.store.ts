"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { businessConfig } from "@/config/site.config";
import { createSafeStorage } from "@/lib/safe-storage";
import type { CartItem, ColorThemeId, Coupon, Customization } from "@/types";

export const EMPTY_CUSTOMIZATION: Customization = {
  recipientName: "",
  message: "",
  cardTemplateId: null,
  handwrittenCard: false,
  premiumWrap: false,
};

export type NewCartItem = Omit<CartItem, "lineId">;

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  /** Bản sao thông tin mã để client tự tính lại giảm giá khi giỏ thay đổi; server luôn kiểm tra lại. */
  coupon: Coupon | null;
  hydrated: boolean;
  drawerOpen: boolean;
  /** Tăng mỗi lần thêm sản phẩm để icon giỏ hàng nảy lên */
  bumpKey: number;

  addItem: (item: NewCartItem) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  updateLine: (lineId: string, patch: { colorTheme?: ColorThemeId; customization?: Customization }) => void;
  removeItem: (lineId: string) => void;
  clear: () => void;
  applyCoupon: (coupon: Coupon) => void;
  removeCoupon: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

/** Hai dòng giống hệt nhau (cùng sản phẩm, màu, cá nhân hoá) thì gộp số lượng. */
function lineSignature(item: Pick<CartItem, "productId" | "colorTheme" | "customization" | "box">): string {
  return JSON.stringify([item.productId, item.colorTheme, item.customization, item.box ?? null]);
}

function newLineId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const clampQty = (q: number, max: number) => Math.max(1, Math.min(q, max, businessConfig.stock.maxQuantityPerLine));

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      coupon: null,
      hydrated: false,
      drawerOpen: false,
      bumpKey: 0,

      addItem: (item) => {
        const signature = lineSignature(item);
        const items = get().items;
        const existing = items.find((i) => lineSignature(i) === signature);
        if (existing) {
          set({
            items: items.map((i) => (i.lineId === existing.lineId ? { ...i, quantity: clampQty(i.quantity + item.quantity, i.maxQuantity) } : i)),
          });
        } else {
          set({ items: [...items, { ...item, quantity: clampQty(item.quantity, item.maxQuantity), lineId: newLineId() }] });
        }
        set({ bumpKey: get().bumpKey + 1 });
      },

      updateQuantity: (lineId, quantity) =>
        set({ items: get().items.map((i) => (i.lineId === lineId ? { ...i, quantity: clampQty(quantity, i.maxQuantity) } : i)) }),

      updateLine: (lineId, patch) => set({ items: get().items.map((i) => (i.lineId === lineId ? { ...i, ...patch } : i)) }),

      removeItem: (lineId) => {
        const items = get().items.filter((i) => i.lineId !== lineId);
        set(items.length === 0 ? { items, couponCode: null, coupon: null } : { items });
      },

      clear: () => set({ items: [], couponCode: null, coupon: null }),

      applyCoupon: (coupon) => set({ coupon, couponCode: coupon.code }),
      removeCoupon: () => set({ coupon: null, couponCode: null }),

      openDrawer: () => set({ drawerOpen: true }),
      // Chỉ set khi đang mở: CartDrawer gọi hàm này lúc mount, nếu set trước khi rehydrate thì persist sẽ ghi giỏ rỗng đè lên localStorage
      closeDrawer: () => {
        if (get().drawerOpen) set({ drawerOpen: false });
      },
    }),
    {
      name: "mo-cart-v1",
      version: 1,
      storage: createJSONStorage(() => createSafeStorage("local")),
      partialize: (s) => ({ items: s.items, couponCode: s.couponCode, coupon: s.coupon }),
      // Đọc localStorage sau khi trang đã render để không lệch HTML giữa server và client
      skipHydration: true,
      onRehydrateStorage: () => () => {
        useCartStore.setState({ hydrated: true });
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<CartState>;
        const items = Array.isArray(p.items) ? p.items.filter((i) => i && typeof i.lineId === "string" && i.quantity > 0) : [];
        return { ...current, items, couponCode: p.couponCode ?? null, coupon: p.coupon ?? null };
      },
    },
  ),
);

export const selectItemCount = (s: CartState) => s.items.reduce((sum, i) => sum + i.quantity, 0);
