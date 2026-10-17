"use client";

import Image from "next/image";
import Link from "next/link";
import { PencilLine, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Overlay";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { toast } from "@/components/ui/Toaster";
import { businessConfig } from "@/config/site.config";
import { COLOR_THEMES } from "@/lib/catalog";
import { formatVND } from "@/lib/format";
import { lineSurchargePerUnit } from "@/lib/pricing";
import { cn } from "@/lib/text";
import { useCartStore } from "@/store/cart.store";
import type { CartItem, Customization } from "@/types";
import { BoxContentsSummary, CustomizationSummary } from "../order/CustomizationSummary";
import { cleanCustomization, CustomizationFields, validateCustomization } from "../product/CustomizationFields";
function EditCustomizationModal({ item, open, onClose }: { item: CartItem; open: boolean; onClose: () => void }) {
  const updateLine = useCartStore((s) => s.updateLine);
  const [draft, setDraft] = useState<Customization>(item.customization);
  const [showErrors, setShowErrors] = useState(false);
  const save = () => {
    if (Object.keys(validateCustomization(draft)).length > 0) {
      setShowErrors(true);
      return;
    }
    updateLine(item.lineId, { customization: cleanCustomization(draft) });
    toast.success("Đã cập nhật lời chúc");
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Sửa lời chúc & thiệp"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button variant="secondary" onClick={save}>
            Lưu thay đổi
          </Button>
        </div>
      }
    >
      <CustomizationFields value={draft} onChange={setDraft} showErrors={showErrors} />
    </Modal>
  );
}

export function CartLineItem({ item, compact = false }: { item: CartItem; compact?: boolean }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const closeDrawer = useCartStore((s) => s.closeDrawer);
  const [editing, setEditing] = useState(false);
  const extra = lineSurchargePerUnit(item.customization);
  const lineTotal = (item.unitPrice + extra) * item.quantity;
  const href = item.kind === "product" ? `/san-pham/${item.slug}` : "/tu-thiet-ke";

  return (
    <li className="flex gap-3 py-4 sm:gap-4">
      <Link href={href} onClick={closeDrawer} className={cn("relative shrink-0 overflow-hidden rounded-box bg-surface-sunken", compact ? "size-20" : "size-24 sm:size-28")}>
        <Image src={item.image} alt={item.name} fill sizes="112px" className="object-cover" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={href} onClick={closeDrawer} className="line-clamp-2 font-semibold text-text hover:text-primary">
              {item.name}
            </Link>
            <p className="flex items-center gap-1.5 text-caption text-text-muted">
              <span className="size-3 rounded-full" style={{ backgroundColor: COLOR_THEMES[item.colorTheme]?.swatch }} aria-hidden="true" />
              Màu {COLOR_THEMES[item.colorTheme]?.label ?? item.colorTheme} · {formatVND(item.unitPrice)}
              {extra > 0 && ` + ${formatVND(extra)} phụ phí`}
            </p>
          </div>
          <IconButton
            aria-label={`Xoá ${item.name} khỏi giỏ`}
            tooltip="Xoá khỏi giỏ"
            tooltipSide="left"
            size="sm"
            onClick={() => {
              removeItem(item.lineId);
              toast.info("Đã xoá khỏi giỏ hàng", { description: item.name });
            }}
            className="-mt-1 -mr-1 text-text-muted hover:text-error"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </IconButton>
        </div>
        <BoxContentsSummary box={item.box} />
        <CustomizationSummary customization={item.customization} />
        <button type="button" onClick={() => setEditing(true)} className="inline-flex w-fit items-center gap-1 text-caption font-semibold text-primary hover:underline">
          <PencilLine className="size-3.5" aria-hidden="true" />
          Sửa lời chúc & thiệp
        </button>
        <div className="mt-1 flex items-center justify-between gap-2">
          <QuantityStepper
            size="sm"
            value={item.quantity}
            max={Math.min(item.maxQuantity, businessConfig.stock.maxQuantityPerLine)}
            onChange={(q) => updateQuantity(item.lineId, q)}
            label={`Số lượng ${item.name}`}
          />
          <span className="font-bold text-text tabular-nums">{formatVND(lineTotal)}</span>
        </div>
      </div>
      {editing && <EditCustomizationModal item={item} open={editing} onClose={() => setEditing(false)} />}
    </li>
  );
}
