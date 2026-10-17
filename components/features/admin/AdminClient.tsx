"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LogoutButton } from "@/components/features/account/AccountClient";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Form";
import { toast } from "@/components/ui/Toaster";
import { postJSON } from "@/lib/api-client";
import { CARRIER_IDS, CARRIERS, type CarrierId } from "@/lib/carriers";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/catalog";
import { cn } from "@/lib/text";
import type { OrderStatus, PaymentStatus, Shipment } from "@/types";

// Đăng xuất dùng chung với khách hàng
export { LogoutButton };

const ADMIN_LINKS = [
  { href: "/admin/don-hang", label: "Đơn hàng" },
  { href: "/admin/san-pham", label: "Sản phẩm" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <nav aria-label="Quản trị" className="flex gap-2">
        {ADMIN_LINKS.map((l) => {
          const active = pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={cn("rounded-full px-4 py-2 text-small font-semibold", active ? "bg-primary text-on-dark" : "text-primary hover:bg-primary-soft")}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
      <LogoutButton />
    </div>
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
