"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ClipboardList, LayoutDashboard, Package, Store } from "lucide-react";
import { LogoutButton } from "@/components/features/account/AccountClient";
import { Logo } from "@/components/features/layout/Logo";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Form";
import { toast } from "@/components/ui/Toaster";
import { postJSON } from "@/lib/api-client";
import { CARRIER_IDS, CARRIERS, type CarrierId } from "@/lib/carriers";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/catalog";
import { formatVND } from "@/lib/format";
import { cn } from "@/lib/text";
import type { OrderStatus, PaymentStatus, Shipment } from "@/types";

// Đăng xuất dùng chung với khách hàng
export { LogoutButton };

const ADMIN_LINKS = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/don-hang", label: "Đơn hàng", icon: ClipboardList },
  { href: "/admin/san-pham", label: "Sản phẩm", icon: Package },
];

const POLL_MS = 20_000;

type PendingSummary = { pending: number; latest: { code: string; customerName: string; total: number } | null };

/**
 * Thanh điều hướng riêng của khu quản trị (thay header cửa hàng).
 * Cứ 20 giây hỏi server một lần: có đơn mới thì hiện thông báo, cập nhật số đơn chờ và làm mới trang đang xem.
 */
export function AdminHeader({ initial, adminName }: { initial: PendingSummary; adminName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, setPending] = useState(initial.pending);
  const lastCode = useRef(initial.latest?.code ?? null);

  useEffect(() => {
    let stopped = false;
    const check = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/admin/orders/summary", { cache: "no-store" });
        if (!res.ok || stopped) return;
        const data = (await res.json()) as PendingSummary;
        setPending(data.pending);
        if (data.latest && data.latest.code !== lastCode.current) {
          lastCode.current = data.latest.code;
          toast.success("Có đơn hàng mới!", { description: `${data.latest.code} · ${data.latest.customerName} · ${formatVND(data.latest.total)}` });
          router.refresh();
        }
      } catch {
        /* mất mạng tạm thời – lần sau hỏi lại */
      }
    };
    const timer = setInterval(check, POLL_MS);
    document.addEventListener("visibilitychange", check);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [router]);

  // Hiện số đơn chờ trên tab trình duyệt để để ý được cả khi đang ở tab khác.
  // Next.js đặt lại <title> sau mỗi lần chuyển trang nên theo dõi thẻ title và gắn lại tiền tố.
  useEffect(() => {
    const apply = () => {
      const base = document.title.replace(/^\(\d+\) /, "");
      const next = pending > 0 ? `(${pending}) ${base}` : base;
      if (document.title !== next) document.title = next;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, [pending]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-3">
        <Link href="/admin" className="flex items-center gap-2">
          <Logo size="sm" asLink={false} />
          <span className="hidden rounded-full bg-primary-soft px-2.5 py-0.5 text-caption font-semibold text-primary sm:inline">Quản trị</span>
        </Link>
        <nav aria-label="Quản trị" className="scrollbar-none mx-auto flex gap-1 overflow-x-auto">
          {ADMIN_LINKS.map(({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-10 shrink-0 items-center gap-2 rounded-full px-3 text-small font-semibold sm:px-4",
                  active ? "bg-primary text-on-dark" : "text-primary hover:bg-primary-soft",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sr-only sm:hidden">{label}</span>
                {href === "/admin/don-hang" && pending > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-strong px-1 text-[11px] font-bold text-white tabular-nums" aria-label={`${pending} đơn chờ xác nhận`}>
                    {pending > 99 ? "99+" : pending}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1">
          <Link href="/" target="_blank" className="hidden h-10 items-center gap-1.5 rounded-full px-3 text-small font-semibold text-primary hover:bg-primary-soft md:flex">
            <Store className="size-4" aria-hidden="true" /> Xem cửa hàng
          </Link>
          <span className="hidden max-w-32 truncate text-small text-text-muted lg:inline" title={adminName}>
            {adminName}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}

export function OrderStatusActions({ code, nextStatuses, paymentStatus }: { code: string; nextStatuses: OrderStatus[]; paymentStatus: PaymentStatus }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const patch = async (body: Record<string, string>, key: string) => {
    setBusy(key);
    const res = await postJSON(`/api/admin/orders/${code}`, body, { method: "PATCH" });
    setBusy(null);
    if (res.ok) {
      toast.success("Đã cập nhật đơn hàng");
      setNote("");
      router.refresh();
    } else toast.error("Không cập nhật được", { description: res.error });
  };

  return (
    <div className="flex flex-col gap-4">
      {nextStatuses.length > 0 ? (
        <>
          <Field label="Ghi chú cho khách (hiện trên timeline)" optional>
            {({ id }) => <Input id={id} value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Ví dụ: Shipper Minh – 0901xxxxxx" />}
          </Field>
          <div className="flex flex-wrap gap-2">
            {nextStatuses.map((s) => (
              <Button
                key={s}
                variant={s === "cancelled" ? "ghost" : "secondary"}
                size="sm"
                loading={busy === s}
                onClick={() => patch({ status: s, note }, s)}
                className={s === "cancelled" ? "text-error hover:bg-error-bg" : undefined}
              >
                {s === "cancelled" ? "Huỷ đơn" : `Chuyển sang: ${ORDER_STATUS_LABELS[s]}`}
              </Button>
            ))}
          </div>
        </>
      ) : (
        <p className="text-small text-text-muted">Đơn đã ở trạng thái cuối, không thể chuyển tiếp.</p>
      )}
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <span className="text-small text-text-muted">Thanh toán: {PAYMENT_STATUS_LABELS[paymentStatus]}</span>
        {paymentStatus !== "paid" && (
          <Button size="sm" variant="outline" loading={busy === "paid"} onClick={() => patch({ paymentStatus: "paid" }, "paid")}>
            Đánh dấu đã thanh toán
          </Button>
        )}
        {paymentStatus === "paid" && (
          <Button size="sm" variant="ghost" loading={busy === "refunded"} onClick={() => patch({ paymentStatus: "refunded" }, "refunded")}>
            Đánh dấu đã hoàn tiền
          </Button>
        )}
      </div>
    </div>
  );
}

/** Admin nhập hãng vận chuyển + mã vận đơn (hoặc tên/SĐT shipper) để khách theo dõi đơn. */
export function ShipmentForm({ code, shipment }: { code: string; shipment: Shipment | null }) {
  const router = useRouter();
  const [carrier, setCarrier] = useState<CarrierId | "">(shipment?.carrier ?? "");
  const [trackingCode, setTrackingCode] = useState(shipment?.trackingCode ?? "");
  const [shipperName, setShipperName] = useState(shipment?.shipperName ?? "");
  const [shipperPhone, setShipperPhone] = useState(shipment?.shipperPhone ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const save = async (clear = false) => {
    setSaving(true);
    setErrors({});
    const body = clear
      ? { shipment: { carrier: null, trackingCode: "", shipperName: "", shipperPhone: "" } }
      : { shipment: { carrier: carrier || null, trackingCode, shipperName, shipperPhone } };
    const res = await postJSON(`/api/admin/orders/${code}`, body, { method: "PATCH" });
    setSaving(false);
    if (!res.ok) {
      const fieldErrors = Object.fromEntries(Object.entries(res.fieldErrors ?? {}).map(([k, v]) => [k.replace("shipment.", ""), v]));
      setErrors(fieldErrors);
      if (!Object.keys(fieldErrors).length) toast.error("Không lưu được", { description: res.error });
      return;
    }
    if (clear) {
      setCarrier("");
      setTrackingCode("");
      setShipperName("");
      setShipperPhone("");
    }
    toast.success(clear ? "Đã xoá thông tin vận chuyển" : "Đã lưu thông tin vận chuyển");
    router.refresh();
  };

  const needsCode = carrier !== "" && carrier !== "shop" && carrier !== "ahamove" && carrier !== "grab";

  return (
    <div className="flex flex-col gap-4">
      <Field label="Hãng vận chuyển" error={errors.carrier}>
        {({ id, describedBy, invalid }) => (
          <Select id={id} aria-describedby={describedBy} invalid={invalid} value={carrier} onChange={(e) => setCarrier(e.target.value as CarrierId | "")}>
            <option value="">— Chưa chọn —</option>
            {CARRIER_IDS.map((c) => (
              <option key={c} value={c}>
                {CARRIERS[c].label}
              </option>
            ))}
          </Select>
        )}
      </Field>
      {carrier !== "" && (
        <>
          <Field
            label="Mã vận đơn"
            required={needsCode}
            optional={!needsCode}
            hint={needsCode ? "Lấy trên phiếu gửi / app của hãng. Khách bấm là mở trang theo dõi của hãng." : undefined}
            error={errors.trackingCode}
          >
            {({ id, describedBy, invalid }) => (
              <Input id={id} aria-describedby={describedBy} invalid={invalid} value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} maxLength={50} className="font-mono" />
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <Field label="Tên shipper" optional error={errors.shipperName}>
              {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} invalid={invalid} value={shipperName} onChange={(e) => setShipperName(e.target.value)} maxLength={50} />}
            </Field>
            <Field label="SĐT shipper" optional error={errors.shipperPhone}>
              {({ id, describedBy, invalid }) => (
                <Input id={id} aria-describedby={describedBy} invalid={invalid} type="tel" inputMode="tel" value={shipperPhone} onChange={(e) => setShipperPhone(e.target.value)} />
              )}
            </Field>
          </div>
        </>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" loading={saving} disabled={carrier === ""} onClick={() => save()}>
          Lưu thông tin vận chuyển
        </Button>
        {shipment && (
          <Button variant="ghost" size="sm" disabled={saving} onClick={() => save(true)} className="text-error hover:bg-error-bg">
            Xoá
          </Button>
        )}
      </div>
    </div>
  );
}
