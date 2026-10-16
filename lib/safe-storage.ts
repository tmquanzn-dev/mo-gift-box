import type { StateStorage } from "zustand/middleware";

/**
 * Storage an toàn: dùng localStorage/sessionStorage nếu được, tự chuyển sang bộ nhớ tạm
 * khi trình duyệt chặn (chế độ ẩn danh, bộ nhớ đầy, tắt cookie...).
 */
export function createSafeStorage(kind: "local" | "session" = "local"): StateStorage {
  const memory = new Map<string, string>();

  const getNative = (): Storage | null => {
    try {
      if (typeof window === "undefined") return null;
      const storage = kind === "local" ? window.localStorage : window.sessionStorage;
      const probe = "__mo_probe__";
      storage.setItem(probe, probe);
      storage.removeItem(probe);
      return storage;
    } catch {
      return null;
    }
  };

  return {
    getItem: (name) => {
      try {
        return getNative()?.getItem(name) ?? memory.get(name) ?? null;
      } catch {
        return memory.get(name) ?? null;
      }
    },
    setItem: (name, value) => {
      memory.set(name, value);
      try {
        getNative()?.setItem(name, value);
      } catch {
        /* giữ trong bộ nhớ */
      }
    },
    removeItem: (name) => {
      memory.delete(name);
      try {
        getNative()?.removeItem(name);
      } catch {
        /* bỏ qua */
      }
    },
  };
}
