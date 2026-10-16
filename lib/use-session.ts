"use client";

import { useEffect, useSyncExternalStore } from "react";

/** Bản sao phía trình duyệt của người đang đăng nhập (khớp SessionUser ở server/auth.ts). */
export interface ClientUser {
  id: string;
  email: string;
  phone: string | null;
  fullName: string;
  role: "customer" | "admin";
}

type SessionState = { status: "loading" | "ready"; user: ClientUser | null };

/*
 * Một kho nhỏ dùng chung cho cả trang: header, trang thanh toán… cùng đọc, chỉ gọi /api/auth/me một lần.
 * Các trang vẫn render tĩnh (nhanh), thông tin đăng nhập nạp sau trên trình duyệt.
 */
let state: SessionState = { status: "loading", user: null };
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();
const SERVER_STATE: SessionState = { status: "loading", user: null };

function emit(next: SessionState) {
  state = next;
  listeners.forEach((l) => l());
}

export function refreshSession(): Promise<void> {
  inflight ??= fetch("/api/auth/me", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : { user: null }))
    .then((data: { user?: ClientUser | null }) => emit({ status: "ready", user: data.user ?? null }))
    .catch(() => emit({ status: "ready", user: null }))
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Cập nhật ngay sau khi đăng nhập / đăng xuất / sửa hồ sơ, không cần gọi lại server. */
export function setSessionUser(user: ClientUser | null) {
  emit({ status: "ready", user });
}

let loaded = false;

export function useSession(): SessionState {
  const snapshot = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => SERVER_STATE,
  );
  useEffect(() => {
    if (loaded) return;
    loaded = true;
    void refreshSession();
  }, []);
  return snapshot;
}
