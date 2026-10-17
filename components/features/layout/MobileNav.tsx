"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUserRound, LayoutDashboard, PackageSearch, Phone } from "lucide-react";
import { useEffect } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Overlay";
import { siteConfig } from "@/config/site.config";
import { shopHref } from "@/lib/filters";
import { useSession } from "@/lib/use-session";
import type { Occasion } from "@/types";
import { NAV_LINKS } from "./nav-links";

export function MobileNav({ open, onClose, occasions }: { open: boolean; onClose: () => void; occasions: Occasion[] }) {
  const pathname = usePathname();
  const { user } = useSession();
  useEffect(() => {
    onClose();
    // Đóng menu mỗi khi chuyển trang
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <Drawer open={open} onClose={onClose} title="Menu" side="left">
      <nav aria-label="Menu di động" className="flex flex-col gap-6 px-5 py-5">
        {!user && (
          <div className="flex flex-col gap-2 rounded-card bg-primary-soft p-4">
            <p className="text-small text-text-muted">Đăng nhập để theo dõi đơn và đặt quà nhanh hơn.</p>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/dang-nhap" className={buttonClasses("outline", "md")}>
                Đăng nhập
              </Link>
              <Link href="/dang-ky" className={buttonClasses("secondary", "md")}>
                Đăng ký
              </Link>
            </div>
          </div>
        )}
        <ul className="flex flex-col">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="flex h-12 items-center rounded-box px-3 text-body font-semibold text-text hover:bg-primary-soft">
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/tra-cuu-don-hang" className="flex h-12 items-center gap-2 rounded-box px-3 text-body font-semibold text-text hover:bg-primary-soft">
              <PackageSearch className="size-5 text-primary" aria-hidden="true" />
              Tra cứu đơn hàng
            </Link>
          </li>
          <li>
            <Link href={user ? "/tai-khoan" : "/dang-nhap"} className="flex h-12 items-center gap-2 rounded-box px-3 text-body font-semibold text-text hover:bg-primary-soft">
              <CircleUserRound className="size-5 text-primary" aria-hidden="true" />
              {user ? "Tài khoản của tôi" : "Đăng nhập / Đăng ký"}
            </Link>
          </li>
          {user?.role === "admin" && (
            <li>
              <Link href="/admin" className="flex h-12 items-center gap-2 rounded-box px-3 text-body font-semibold text-text hover:bg-primary-soft">
                <LayoutDashboard className="size-5 text-primary" aria-hidden="true" />
                Trang quản trị
              </Link>
            </li>
          )}
        </ul>

        <div>
          <p className="mb-2 px-3 text-caption font-semibold tracking-[0.18em] text-text-muted uppercase">Quà theo dịp</p>
          <ul className="grid grid-cols-2 gap-2">
            {occasions.map((o) => (
              <li key={o.id}>
                <Link
                  href={shopHref({ occasions: [o.slug] })}
                  className="flex h-11 items-center justify-center rounded-full border border-secondary px-3 text-small font-medium text-text hover:bg-primary-soft"
                >
                  {o.shortName}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <a href={`tel:${siteConfig.contact.hotlineTel}`} className="flex items-center gap-3 rounded-card bg-primary-soft p-4">
          <Phone className="size-5 text-primary" aria-hidden="true" />
          <span className="flex flex-col">
            <span className="text-caption text-text-muted">Cần MÓ tư vấn?</span>
            <span className="font-semibold text-text">{siteConfig.contact.hotline}</span>
          </span>
        </a>
      </nav>
    </Drawer>
  );
}
