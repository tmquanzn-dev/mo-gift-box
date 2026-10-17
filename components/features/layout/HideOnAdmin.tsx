"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Ẩn phần giao diện của cửa hàng (header, giỏ hàng, footer, chat…) trong khu vực /admin. */
export function HideOnAdmin({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;
  return <>{children}</>;
}
