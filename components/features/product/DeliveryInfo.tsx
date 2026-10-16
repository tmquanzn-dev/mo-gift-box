import Link from "next/link";
import { Clock, RefreshCcw, Truck } from "lucide-react";
import { businessConfig } from "@/config/site.config";
import { deliveryPolicyText, estimateDelivery } from "@/lib/delivery";
import { formatDeliveryRange, formatVND } from "@/lib/format";
import { SHOP_PROVINCE_NAME } from "@/services/address.service";

/** Khối "biết rõ trước khi mua": phí ship, ngày giao dự kiến, đổi trả. */
export function DeliveryInfo() {
  const { shipping, surcharges } = businessConfig;
  const text = deliveryPolicyText();
  const inner = estimateDelivery("noi-thanh");
  const outer = estimateDelivery("ngoai-thanh");
  return (
    <ul className="flex flex-col divide-y divide-border rounded-card border border-border bg-surface">
      <li className="flex gap-3 p-4">
        <Truck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="text-small">
          <p className="font-semibold text-text">Phí vận chuyển</p>
          <p className="text-text-muted">
            Nội thành {SHOP_PROVINCE_NAME}: {formatVND(shipping.innerCityFee)} · Ngoại thành & tỉnh khác: {formatVND(shipping.outerFee)}
          </p>
          <p className="font-medium text-success">Miễn phí cho đơn từ {formatVND(shipping.freeShippingThreshold)}</p>
        </div>
      </li>
      <li className="flex gap-3 p-4">
        <Clock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="text-small">
          <p className="font-semibold text-text">Giao dự kiến nếu đặt bây giờ</p>
          <p className="text-text-muted">
            Nội thành ({text.inner}): <span className="text-text">{formatDeliveryRange(inner)}</span>
          </p>
          <p className="text-text-muted">
            Tỉnh khác ({text.outer}): <span className="text-text">{formatDeliveryRange(outer)}</span>
          </p>
          <p className="text-caption text-text-muted">
            Đơn đặt sau {text.cutoff} được tính từ ngày hôm sau. Cần gấp? Chọn giao nhanh trong ngày (+{formatVND(surcharges.expressDelivery)}) ở bước thanh toán.
          </p>
        </div>
      </li>
      <li className="flex gap-3 p-4">
        <RefreshCcw className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="text-small">
          <p className="font-semibold text-text">Đổi trả dễ dàng</p>
          <p className="text-text-muted">
            Hộp quà bị móp, hỏng hoặc giao sai, MÓ đổi mới miễn phí. Bạn chỉ cần báo trong vòng [[24 giờ]] kèm ảnh chụp.{" "}
            <Link href="/chinh-sach/doi-tra" className="font-semibold text-primary underline">
              Xem chính sách
            </Link>
          </p>
        </div>
      </li>
    </ul>
  );
}
