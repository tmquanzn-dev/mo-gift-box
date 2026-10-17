import "server-only";
import { Prisma, type Order as OrderRow, type OrderItem as OrderItemRow, type OrderEvent as OrderEventRow } from "@prisma/client";
import { businessConfig } from "@/config/site.config";
import { isCarrier } from "@/lib/carriers";
import { isColorTheme } from "@/lib/catalog";
import { diffDays, estimateDelivery, latestPreferredDate } from "@/lib/delivery";
import { generateOrderCode } from "@/lib/order-code";
import { computeTotals, type PricingLine } from "@/lib/pricing";
import { normalizeMessage, normalizeName, normalizePhone } from "@/lib/text";
import { WARD_OTHER, type CreateOrderPayload, type ShipmentPayload } from "@/lib/validation";
import { db } from "@/server/db";
import type {
  ColorThemeId,
  CustomBoxSelection,
  Customization,
  Order,
  OrderEvent,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShippingZone,
} from "@/types";
import { getProvince, getWard, resolveZone } from "./address.service";
import { getCardTemplate } from "./content.service";
import { findCoupon } from "./coupon.service";

/** Lỗi nghiệp vụ có thông điệp tiếng Việt để hiển thị thẳng cho khách. */
export class OrderError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}

type OrderWithRelations = OrderRow & { items: OrderItemRow[]; events: OrderEventRow[] };

function parseJSON<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function toOrder(row: OrderWithRelations): Order {
  return {
    code: row.code,
    customer: { fullName: row.customerName, phone: row.customerPhone, email: row.customerEmail },
    recipient: { fullName: row.recipientName, phone: row.recipientPhone },
    address: {
      provinceId: row.provinceId,
      provinceName: row.provinceName,
      wardId: row.wardId,
      wardName: row.wardName,
      street: row.street,
      note: row.note,
    },
    zone: row.zone as ShippingZone,
    items: row.items.map(
      (i): OrderItem => ({
        kind: i.kind === "custom-box" ? "custom-box" : "product",
        productId: i.productId,
        slug: i.slug,
        name: i.name,
        image: i.image,
        colorTheme: i.colorTheme as ColorThemeId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        customization: parseJSON<Customization>(i.customization, {
          recipientName: "",
          message: "",
          cardTemplateId: null,
          handwrittenCard: false,
          premiumWrap: false,
        }),
        box: parseJSON<CustomBoxSelection | null>(i.box, null),
      }),
    ),
    subtotal: row.subtotal,
    discount: row.discount,
    couponCode: row.couponCode,
    shippingFee: row.shippingFee,
    surcharges: {
      handwrittenCard: row.surchargeHandwritten,
      premiumWrap: row.surchargePremium,
      expressDelivery: row.surchargeExpress,
    },
    total: row.total,
    paymentMethod: row.paymentMethod as PaymentMethod,
    paymentStatus: row.paymentStatus as PaymentStatus,
    status: row.status as OrderStatus,
    preferredDate: row.preferredDate,
    hidePrice: row.hidePrice,
    express: row.express,
    createdAt: row.createdAt.toISOString(),
    expectedDeliveryDate: { from: row.expectedFrom, to: row.expectedTo },
    shipment: isCarrier(row.carrier)
      ? { carrier: row.carrier, trackingCode: row.trackingCode, shipperName: row.shipperName, shipperPhone: row.shipperPhone }
      : null,
    events: [...row.events]
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((e): OrderEvent => ({ status: e.status as OrderStatus, note: e.note, createdAt: e.createdAt.toISOString() })),
  };
}

function sanitizeCustomization(input: Customization, allowCustomization: boolean): Customization {
  if (!allowCustomization) {
    return { recipientName: "", message: "", cardTemplateId: null, handwrittenCard: false, premiumWrap: input.premiumWrap };
  }
  return {
    recipientName: normalizeName(input.recipientName).slice(0, businessConfig.customization.recipientNameMax),
    message: normalizeMessage(input.message).slice(0, businessConfig.customization.messageMax),
    cardTemplateId: getCardTemplate(input.cardTemplateId) ? input.cardTemplateId : null,
    handwrittenCard: input.handwrittenCard,
    premiumWrap: input.premiumWrap,
  };
}

interface ResolvedLine extends PricingLine {
  kind: "product" | "custom-box";
  productId: string | null;
  slug: string | null;
  name: string;
  image: string;
  colorTheme: ColorThemeId;
  customization: Customization;
  box: CustomBoxSelection | null;
}

/** Tạo đơn hàng: kiểm tra lại toàn bộ dữ liệu, tính tiền bằng giá trong database, trừ kho trong một transaction. */
export async function createOrder(input: CreateOrderPayload, now: Date = new Date(), userId: string | null = null): Promise<Order> {
  const { form, items, couponCode } = input;

  /* 1. Địa chỉ & khu vực giao */
  const province = getProvince(form.address.provinceId);
  if (!province) throw new OrderError("address", "Tỉnh/thành phố không hợp lệ. Bạn chọn lại giúp MÓ nhé.");
  let wardId: string | null = null;
  let wardName: string;
  if (form.address.wardId === WARD_OTHER) {
    wardName = normalizeName(form.address.wardName);
  } else {
    const ward = getWard(province.id, form.address.wardId);
    if (!ward) throw new OrderError("address", "Phường/xã không hợp lệ. Bạn chọn lại giúp MÓ nhé.");
    wardId = ward.id;
    wardName = ward.name;
  }
  const zone = resolveZone(province.id, form.address.wardId) ?? "ngoai-thanh";
  if (form.express && zone !== "noi-thanh") {
    throw new OrderError("express", "Giao nhanh trong ngày chỉ áp dụng cho khu vực nội thành.");
  }

  /* 2. Sản phẩm & giá */
  const productIds = [...new Set(items.filter((i) => i.kind === "product").map((i) => i.productId))];
  const boxItemIds = [...new Set(items.flatMap((i) => i.box?.items.map((b) => b.itemId) ?? []))];
  const [products, boxItems] = await Promise.all([
    db.product.findMany({ where: { id: { in: productIds }, isActive: true } }),
    db.boxItem.findMany({ where: { id: { in: boxItemIds }, isActive: true } }),
  ]);
  const productMap = new Map(products.map((p) => [p.id, p]));
  const boxItemMap = new Map(boxItems.map((b) => [b.id, b]));

  const productDemand = new Map<string, number>();
  const boxItemDemand = new Map<string, number>();
  const lines: ResolvedLine[] = [];

  for (const line of items) {
    if (!isColorTheme(line.colorTheme)) throw new OrderError("item", "Chủ đề màu không hợp lệ.");

    if (line.kind === "product") {
      const product = productMap.get(line.productId);
      if (!product) throw new OrderError("item", "Một sản phẩm trong giỏ không còn bán nữa. Bạn xoá khỏi giỏ giúp MÓ nhé.", 409);
      const themes = parseJSON<string[]>(product.colorThemes, []);
      if (!themes.includes(line.colorTheme)) throw new OrderError("item", `${product.name} không có chủ đề màu đã chọn.`);
      productDemand.set(product.id, (productDemand.get(product.id) ?? 0) + line.quantity);
      const images = parseJSON<string[]>(product.images, []);
      lines.push({
        kind: "product",
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: images[0] ?? "",
        colorTheme: line.colorTheme,
        quantity: line.quantity,
        unitPrice: product.price,
        customization: sanitizeCustomization(line.customization, product.isCustomizable),
        box: null,
      });
      continue;
    }

    // Hộp tự thiết kế
    const size = businessConfig.boxBuilder.sizes.find((s) => s.id === line.box?.sizeId);
    if (!size || !line.box) throw new OrderError("item", "Kích thước hộp tự thiết kế không hợp lệ.");
    let used = 0;
    let price: number = size.basePrice;
    const selection: CustomBoxSelection = { sizeId: size.id, items: [] };
    for (const pick of line.box.items) {
      const item = boxItemMap.get(pick.itemId);
      if (!item) throw new OrderError("item", "Một món trong hộp tự thiết kế không còn bán nữa.", 409);
      used += item.size * pick.quantity;
      price += item.price * pick.quantity;
      boxItemDemand.set(item.id, (boxItemDemand.get(item.id) ?? 0) + pick.quantity * line.quantity);
      selection.items.push({ itemId: item.id, name: item.name, quantity: pick.quantity, price: item.price, size: item.size });
    }
    if (used > size.capacity) {
      throw new OrderError("item", `${size.name} chỉ chứa tối đa ${size.capacity} ô, hộp của bạn đang dùng ${used} ô.`);
    }
    lines.push({
      kind: "custom-box",
      productId: null,
      slug: null,
      name: `Hộp quà tự thiết kế – ${size.name}`,
      image: businessConfig.boxBuilder.image,
      colorTheme: line.colorTheme,
      quantity: line.quantity,
      unitPrice: price,
      customization: sanitizeCustomization(line.customization, true),
      box: selection,
    });
  }

  for (const [id, qty] of productDemand) {
    const p = productMap.get(id)!;
    if (p.stock < qty) {
      throw new OrderError("stock", p.stock > 0 ? `${p.name} chỉ còn ${p.stock} hộp.` : `${p.name} vừa hết hàng mất rồi.`, 409);
    }
  }
  for (const [id, qty] of boxItemDemand) {
    const b = boxItemMap.get(id)!;
    if (b.stock < qty) throw new OrderError("stock", `${b.name} chỉ còn ${b.stock} phần.`, 409);
  }

  /* 3. Mã giảm giá & tổng tiền */
  const coupon = couponCode ? await findCoupon(couponCode) : null;
  const totals = computeTotals({ lines, coupon, couponCode, zone, express: form.express, now });
  if (couponCode && totals.couponEvaluation && !totals.couponEvaluation.ok) {
    throw new OrderError("coupon", totals.couponEvaluation.message, 409);
  }

  /* 4. Ngày giao */
  const estimate = estimateDelivery(zone, form.express, now);
  const preferredDate = form.preferredDate || null;
  if (preferredDate) {
    if (diffDays(estimate.from, preferredDate) < 0) {
      throw new OrderError("preferredDate", "Ngày giao mong muốn sớm hơn ngày MÓ có thể giao. Bạn chọn ngày khác nhé.");
    }
    if (diffDays(preferredDate, latestPreferredDate(now)) < 0) {
      throw new OrderError("preferredDate", `Bạn chỉ có thể hẹn ngày giao trong vòng ${businessConfig.delivery.maxPreferredDays} ngày tới.`);
    }
  }
  const expected = preferredDate ? { from: preferredDate, to: preferredDate } : { from: estimate.from, to: estimate.to };

  const customerPhone = normalizePhone(form.customer.phone);
  const recipientName = form.recipientIsDifferent ? normalizeName(form.recipient.fullName) : normalizeName(form.customer.fullName);
  const recipientPhone = form.recipientIsDifferent ? normalizePhone(form.recipient.phone) : customerPhone;

  /* 5. Ghi database – thử lại nếu trùng mã đơn */
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateOrderCode(now);
    try {
      const row = await db.$transaction(async (tx) => {
        for (const [id, qty] of productDemand) {
          const res = await tx.product.updateMany({
            where: { id, stock: { gte: qty } },
            data: { stock: { decrement: qty }, soldCount: { increment: qty } },
          });
          if (res.count === 0) throw new OrderError("stock", "Một sản phẩm vừa hết hàng. Bạn tải lại trang giúp MÓ nhé.", 409);
        }
        for (const [id, qty] of boxItemDemand) {
          const res = await tx.boxItem.updateMany({ where: { id, stock: { gte: qty } }, data: { stock: { decrement: qty } } });
          if (res.count === 0) throw new OrderError("stock", "Một món trong hộp tự thiết kế vừa hết hàng.", 409);
        }
        if (coupon && totals.discount > 0) {
          const res = await tx.coupon.updateMany({
            where: { code: coupon.code, usedCount: { lt: coupon.usageLimit } },
            data: { usedCount: { increment: 1 } },
          });
          if (res.count === 0) throw new OrderError("coupon", `Mã ${coupon.code} vừa hết lượt sử dụng.`, 409);
        }
        return tx.order.create({
          data: {
            code,
            userId,
            customerName: normalizeName(form.customer.fullName),
            customerPhone,
            customerEmail: form.customer.email.trim() || null,
            recipientName,
            recipientPhone,
            provinceId: province.id,
            provinceName: province.name,
            wardId,
            wardName,
            street: form.address.street.trim(),
            note: form.address.note.trim() || null,
            zone,
            preferredDate,
            hidePrice: form.hidePrice,
            express: form.express && zone === "noi-thanh",
            paymentMethod: form.paymentMethod,
            couponCode: totals.discount > 0 && coupon ? coupon.code : null,
            subtotal: totals.subtotal,
            discount: totals.discount,
            shippingFee: totals.shippingFee ?? 0,
            surchargeHandwritten: totals.surcharges.handwrittenCard,
            surchargePremium: totals.surcharges.premiumWrap,
            surchargeExpress: totals.surcharges.expressDelivery,
            total: totals.total,
            expectedFrom: expected.from,
            expectedTo: expected.to,
            createdAt: now,
            items: {
              create: lines.map((l) => ({
                kind: l.kind,
                productId: l.productId,
                slug: l.slug,
                name: l.name,
                image: l.image,
                colorTheme: l.colorTheme,
                quantity: l.quantity,
                unitPrice: l.unitPrice,
                customization: JSON.stringify(l.customization),
                box: l.box ? JSON.stringify(l.box) : null,
              })),
            },
            events: { create: [{ status: "pending", note: "Khách đặt hàng trên website", createdAt: now }] },
          },
          include: { items: true, events: true },
        });
      });
      return toOrder(row);
    } catch (error) {
      const isDuplicateCode =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        JSON.stringify(error.meta?.target ?? "").includes("code");
      if (isDuplicateCode) continue;
      throw error;
    }
  }
  throw new OrderError("code", "MÓ đang bận một chút, bạn thử đặt lại sau vài giây nhé.", 503);
}

export async function getOrderByCode(code: string): Promise<Order | null> {
  const row = await db.order.findUnique({ where: { code }, include: { items: true, events: true } });
  return row ? toOrder(row) : null;
}

/** Tra cứu đơn: cần đúng cả mã đơn và số điện thoại (người đặt hoặc người nhận). */
export async function lookupOrder(code: string, phone: string): Promise<Order | null> {
  const normalized = normalizePhone(phone);
  const row = await db.order.findFirst({
    where: { code, OR: [{ customerPhone: normalized }, { recipientPhone: normalized }] },
    include: { items: true, events: true },
  });
  return row ? toOrder(row) : null;
}

/* ---------- Dành cho trang quản trị ---------- */

export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["shipping", "cancelled"],
  shipping: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export async function listOrders(params: { status?: OrderStatus | null; q?: string; take?: number } = {}): Promise<Order[]> {
  const q = params.q?.trim();
  const rows = await db.order.findMany({
    where: {
      ...(params.status ? { status: params.status } : {}),
      ...(q ? { OR: [{ code: { contains: q.toUpperCase() } }, { customerPhone: { contains: q } }, { recipientPhone: { contains: q } }] } : {}),
    },
    include: { items: true, events: true },
    orderBy: { createdAt: "desc" },
    take: params.take ?? 100,
  });
  return rows.map(toOrder);
}

export async function updateOrderStatus(code: string, next: OrderStatus, note?: string): Promise<Order> {
  return db.$transaction(async (tx) => {
    const row = await tx.order.findUnique({ where: { code }, include: { items: true } });
    if (!row) throw new OrderError("not_found", "Không tìm thấy đơn hàng.", 404);
    const current = row.status as OrderStatus;
    if (!STATUS_TRANSITIONS[current].includes(next)) {
      throw new OrderError("transition", `Không thể chuyển đơn từ trạng thái hiện tại sang trạng thái này.`, 409);
    }
    // Huỷ đơn: hoàn lại tồn kho và lượt dùng mã giảm giá
    if (next === "cancelled") {
      if (row.couponCode) {
        await tx.coupon.updateMany({ where: { code: row.couponCode, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
      }
      for (const item of row.items) {
        if (item.kind === "product" && item.productId) {
          // updateMany: sản phẩm có thể đã bị admin xoá, khi đó bỏ qua thay vì làm hỏng thao tác huỷ đơn
          await tx.product.updateMany({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity }, soldCount: { decrement: item.quantity } },
          });
        } else if (item.box) {
          const box = parseJSON<CustomBoxSelection | null>(item.box, null);
          for (const pick of box?.items ?? []) {
            await tx.boxItem.updateMany({ where: { id: pick.itemId }, data: { stock: { increment: pick.quantity * item.quantity } } });
          }
        }
      }
    }
    const updated = await tx.order.update({
      where: { code },
      data: { status: next, events: { create: { status: next, note: note?.trim() || null } } },
      include: { items: true, events: true },
    });
    return toOrder(updated);
  });
}

export async function updatePaymentStatus(code: string, paymentStatus: PaymentStatus): Promise<Order> {
  try {
    const updated = await db.order.update({
      where: { code },
      data: { paymentStatus },
      include: { items: true, events: true },
    });
    return toOrder(updated);
  } catch (error) {
    // P2025: không có bản ghi nào khớp điều kiện
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new OrderError("not_found", "Không tìm thấy đơn hàng.", 404);
    }
    throw error;
  }
}

/** Lưu thông tin vận chuyển (hãng, mã vận đơn, shipper). carrier = null để xoá. */
export async function updateShipment(code: string, input: ShipmentPayload): Promise<Order> {
  const data = input.carrier
    ? {
        carrier: input.carrier,
        trackingCode: input.trackingCode.trim() || null,
        shipperName: normalizeName(input.shipperName) || null,
        shipperPhone: input.shipperPhone ? normalizePhone(input.shipperPhone) : null,
      }
    : { carrier: null, trackingCode: null, shipperName: null, shipperPhone: null };
  try {
    const updated = await db.order.update({ where: { code }, data, include: { items: true, events: true } });
    return toOrder(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new OrderError("not_found", "Không tìm thấy đơn hàng.", 404);
    }
    throw error;
  }
}

export async function getOrderStats() {
  const grouped = await db.order.groupBy({ by: ["status"], _count: { _all: true } });
  return Object.fromEntries(grouped.map((g) => [g.status, g._count._all])) as Partial<Record<OrderStatus, number>>;
}

/* ---------- Tổng quan cho admin ---------- */

/** Các trạng thái admin còn phải xử lý. */
export const ACTIVE_STATUSES: OrderStatus[] = ["pending", "confirmed", "preparing", "shipping"];

/** 0h hôm nay theo giờ Việt Nam (UTC+7), dù server chạy múi giờ nào. */
function startOfTodayVN(now = new Date()): Date {
  const VN_OFFSET = 7 * 60 * 60 * 1000;
  const vn = new Date(now.getTime() + VN_OFFSET);
  vn.setUTCHours(0, 0, 0, 0);
  return new Date(vn.getTime() - VN_OFFSET);
}

export async function getAdminDashboard() {
  const since = startOfTodayVN();
  const [today, todayRevenue, stats, recent] = await Promise.all([
    db.order.count({ where: { createdAt: { gte: since } } }),
    db.order.aggregate({ where: { createdAt: { gte: since }, status: { not: "cancelled" } }, _sum: { total: true } }),
    getOrderStats(),
    listOrders({ take: 8 }),
  ]);
  return {
    todayOrders: today,
    todayRevenue: todayRevenue._sum.total ?? 0,
    stats,
    activeCount: ACTIVE_STATUSES.reduce((sum, s) => sum + (stats[s] ?? 0), 0),
    recent,
  };
}

/** Dữ liệu nhẹ để trang admin hỏi định kỳ xem có đơn mới không. */
export async function getPendingSummary() {
  const [pending, latest] = await Promise.all([
    db.order.count({ where: { status: "pending" } }),
    db.order.findFirst({ orderBy: { createdAt: "desc" }, select: { code: true, customerName: true, total: true } }),
  ]);
  return { pending, latest };
}
