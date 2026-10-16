"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart.store";

/** Nạp giỏ hàng từ localStorage sau khi trang hiển thị, và đồng bộ khi người dùng mở nhiều tab. */
export function CartHydrator() {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
    const onStorage = (e: StorageEvent) => {
      if (e.key === useCartStore.persist.getOptions().name) void useCartStore.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return null;
}
