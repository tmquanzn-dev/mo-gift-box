"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, CircleUserRound, Menu, PackageSearch, Search, ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { buttonClasses, IconButton } from "@/components/ui/Button";
import { shopHref } from "@/lib/filters";
import { useIsClient } from "@/lib/hooks";
import { useSession } from "@/lib/use-session";
import { cn } from "@/lib/text";
import { selectItemCount, useCartStore } from "@/store/cart.store";
import type { Occasion } from "@/types";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";
import { NAV_LINKS } from "./nav-links";
import { SearchDialog } from "./SearchDialog";

function OccasionMenu({ occasions }: { occasions: Occasion[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Đóng menu khi chuyển trang (cập nhật state ngay lúc render thay vì trong effect)
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="occasion-menu"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 items-center gap-1 rounded-full px-4 font-medium text-text hover:bg-primary-soft hover:text-primary"
      >
        Quà theo dịp
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && (
        <div id="occasion-menu" className="absolute top-full left-0 z-50 mt-2 w-[440px] animate-toast-in rounded-card border border-border bg-surface p-3 shadow-float">
          <ul className="grid grid-cols-2 gap-1">
            {occasions.map((o) => (
              <li key={o.id}>
                <Link href={shopHref({ occasions: [o.slug] })} className="flex flex-col rounded-box px-3 py-2.5 hover:bg-primary-soft">
                  <span className="font-semibold text-text">{o.name}</span>
                  <span className="text-caption text-text-muted">{o.description}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/cua-hang" className="mt-2 block rounded-box px-3 py-2 text-center text-small font-semibold text-primary hover:bg-primary-soft">
            Xem tất cả hộp quà
          </Link>
        </div>
      )}
    </div>
  );
}

export function CartButton() {
  const isClient = useIsClient();
  const count = useCartStore(selectItemCount);
  const bumpKey = useCartStore((s) => s.bumpKey);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const shown = isClient ? count : 0;
  return (
    <IconButton aria-label={shown > 0 ? `Giỏ hàng, ${shown} sản phẩm` : "Giỏ hàng trống"} onClick={openDrawer}>
      <ShoppingBag className="size-6" aria-hidden="true" />
      {shown > 0 && (
        <span
          key={bumpKey}
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 animate-bump items-center justify-center rounded-full bg-accent-strong px-1 text-[11px] font-bold text-white tabular-nums ring-2 ring-bg"
        >
          {shown > 99 ? "99+" : shown}
        </span>
      )}
    </IconButton>
  );
}

/**
 * Khu vực tài khoản trên header.
 * - Chưa đăng nhập: màn hình vừa/lớn hiện 2 nút chữ "Đăng nhập" + "Đăng ký"; mobile hiện icon (nút chữ nằm trong menu).
 * - Đã đăng nhập: avatar chữ cái đầu + tên, bấm vào để tới trang tài khoản.
 */
function AccountButtons() {
  const { user } = useSession();

  if (user) {
    const label = `Tài khoản của ${user.fullName}`;
    return (
      <Link href="/tai-khoan" aria-label={label} title={label} className="inline-flex h-11 items-center gap-2 rounded-full px-1.5 text-primary hover:bg-primary-soft md:pr-3">
        <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-primary text-small font-bold text-on-dark">
          {initial(user.fullName)}
        </span>
        <span aria-hidden="true" className="hidden max-w-28 truncate text-small font-semibold text-text md:inline">
          {lastName(user.fullName)}
        </span>
      </Link>
    );
  }

  // Mặc định hiện nút Đăng nhập/Đăng ký ngay (đa số khách chưa đăng nhập); đăng nhập rồi thì đổi sang avatar
  return (
    <>
      <Link href="/dang-nhap" aria-label="Đăng nhập hoặc đăng ký" className="inline-flex size-11 items-center justify-center rounded-full text-primary hover:bg-primary-soft md:hidden">
        <CircleUserRound className="size-[22px]" aria-hidden="true" />
      </Link>
      <div className="ml-1 hidden items-center gap-1.5 md:flex">
        <Link href="/dang-nhap" className={buttonClasses("ghost", "sm", "px-3")}>
          Đăng nhập
        </Link>
        <Link href="/dang-ky" className={buttonClasses("secondary", "sm")}>
          Đăng ký
        </Link>
      </div>
    </>
  );
}

/** Tên gọi = từ cuối của họ tên tiếng Việt. */
function lastName(fullName: string): string {
  return fullName.trim().split(/\s+/).pop() ?? fullName;
}

/** Chữ cái đầu của tên gọi (từ cuối trong họ tên tiếng Việt). */
function initial(fullName: string): string {
  return (fullName.trim().split(/\s+/).pop() ?? "").charAt(0).toUpperCase() || "?";
}

export function Header({ occasions }: { occasions: Occasion[] }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cn("sticky top-0 z-40 border-b bg-bg/90 backdrop-blur-md transition-[border-color,box-shadow]", scrolled ? "border-border shadow-soft" : "border-transparent")}>
      <div className="container-page flex h-16 items-center gap-2 md:h-[72px]">
        <IconButton aria-label="Mở menu" className="-ml-2 lg:hidden" onClick={() => setMobileOpen(true)}>
          <Menu className="size-6" aria-hidden="true" />
        </IconButton>

        <div className="flex flex-1 justify-center lg:flex-none lg:justify-start">
          <Logo size="sm" />
        </div>

        <nav aria-label="Menu chính" className="mx-auto hidden items-center gap-1 lg:flex">
          <Link
            href="/cua-hang"
            aria-current={pathname === "/cua-hang" ? "page" : undefined}
            className="flex h-11 items-center rounded-full px-4 font-medium text-text hover:bg-primary-soft hover:text-primary aria-[current=page]:text-primary"
          >
            Cửa hàng
          </Link>
          <OccasionMenu occasions={occasions} />
          {NAV_LINKS.slice(1).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname.startsWith(link.href) ? "page" : undefined}
              className="flex h-11 items-center rounded-full px-4 font-medium text-text hover:bg-primary-soft hover:text-primary aria-[current=page]:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="-mr-2 flex items-center gap-0.5">
          <IconButton aria-label="Tìm kiếm hộp quà" onClick={() => setSearchOpen(true)}>
            <Search className="size-[22px]" aria-hidden="true" />
          </IconButton>
          <Link
            href="/tra-cuu-don-hang"
            aria-label="Tra cứu đơn hàng"
            className="hidden size-11 items-center justify-center rounded-full text-primary hover:bg-primary-soft sm:inline-flex"
          >
            <PackageSearch className="size-[22px]" aria-hidden="true" />
          </Link>
          <CartButton />
          <AccountButtons />
        </div>
      </div>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} occasions={occasions} />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
