import { z } from "zod";
import { businessConfig } from "@/config/site.config";
import { CARRIER_IDS, type CarrierId } from "./carriers";
import { normalizeMessage, normalizeName, normalizePhone } from "./text";

/** Giá trị đặc biệt của ô Phường/Xã khi khách tự nhập tên phường không có trong danh sách. */
export const WARD_OTHER = "__khac__";

const NAME_PATTERN = /^[\p{L}\p{M}\s]+$/u;
const PHONE_PATTERN = /^0\d{9}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateFullName(raw: string, label = "họ tên"): string | null {
  const value = normalizeName(raw);
  if (!value) return `Bạn nhập ${label} giúp MÓ nhé.`;
  if (value.length < 2) return `${capitalize(label)} cần ít nhất 2 ký tự.`;
  if (value.length > 50) return `${capitalize(label)} tối đa 50 ký tự.`;
  if (!NAME_PATTERN.test(value)) return `${capitalize(label)} chỉ gồm chữ cái và khoảng trắng, không chứa số hay ký tự đặc biệt.`;
  return null;
}

export function validatePhone(raw: string): string | null {
  const value = normalizePhone(raw);
  if (!value) return "Bạn nhập số điện thoại để shipper liên hệ nhé.";
  if (!PHONE_PATTERN.test(value)) return "Số điện thoại cần đủ 10 số và bắt đầu bằng số 0, ví dụ 0901234567.";
  return null;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const issue = (ctx: z.RefinementCtx, message: string | null, path: (string | number)[] = []) => {
  if (message) ctx.addIssue({ code: "custom", message, path });
};

export const fullNameField = z.string().superRefine((v, ctx) => issue(ctx, validateFullName(v)));
export const phoneField = z.string().superRefine((v, ctx) => issue(ctx, validatePhone(v)));
export const optionalEmailField = z
  .string()
  .trim()
  .max(100, { message: "Email tối đa 100 ký tự." })
  .refine((v) => v === "" || EMAIL_PATTERN.test(v), { message: "Email chưa đúng định dạng, ví dụ ban@gmail.com." });

/* ---------- Cá nhân hoá ---------- */

const { recipientNameMax, messageMax } = businessConfig.customization;

export const customizationSchema = z.object({
  recipientName: z
    .string()
    .refine((v) => normalizeName(v).length <= recipientNameMax, {
      message: `Tên người nhận tối đa ${recipientNameMax} ký tự.`,
    })
    .refine((v) => !/[<>{}]/.test(v), { message: "Tên người nhận không được chứa ký tự < > { }." }),
  message: z.string().refine((v) => normalizeMessage(v).length <= messageMax, {
    message: `Lời chúc tối đa ${messageMax} ký tự.`,
  }),
  cardTemplateId: z.string().nullable(),
  handwrittenCard: z.boolean(),
  premiumWrap: z.boolean(),
});

export type CustomizationInput = z.infer<typeof customizationSchema>;

/* ---------- Checkout ---------- */

export const checkoutFormSchema = z
  .object({
    customer: z.object({
      fullName: fullNameField,
      phone: phoneField,
      email: optionalEmailField,
    }),
    recipientIsDifferent: z.boolean(),
    recipient: z.object({
      fullName: z.string(),
      phone: z.string(),
    }),
    address: z.object({
      provinceId: z.string().min(1, { message: "Bạn chọn tỉnh/thành phố nhé." }),
      wardId: z.string().min(1, { message: "Bạn chọn phường/xã nhé." }),
      wardName: z.string(),
      street: z
        .string()
        .trim()
        .min(5, { message: "Bạn ghi rõ số nhà, tên đường giúp MÓ nhé (ít nhất 5 ký tự)." })
        .max(150, { message: "Địa chỉ tối đa 150 ký tự." }),
      note: z.string().max(200, { message: "Ghi chú tối đa 200 ký tự." }),
    }),
    preferredDate: z.string().refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), {
      message: "Ngày giao chưa hợp lệ.",
    }),
    hidePrice: z.boolean(),
    express: z.boolean(),
    paymentMethod: z.enum(["bank_transfer", "cod"], { message: "Bạn chọn phương thức thanh toán nhé." }),
  })
  .superRefine((v, ctx) => {
    if (v.recipientIsDifferent) {
      issue(ctx, validateFullName(v.recipient.fullName, "tên người nhận"), ["recipient", "fullName"]);
      issue(ctx, validatePhone(v.recipient.phone), ["recipient", "phone"]);
    }
    if (v.address.wardId === WARD_OTHER && normalizeName(v.address.wardName).length < 2) {
      issue(ctx, "Bạn nhập tên phường/xã nhé.", ["address", "wardName"]);
    }
  });

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export const STEP_FIELDS = {
  1: [
    "customer.fullName",
    "customer.phone",
    "customer.email",
    "recipient.fullName",
    "recipient.phone",
    "address.provinceId",
    "address.wardId",
    "address.wardName",
    "address.street",
    "address.note",
    "preferredDate",
  ],
  2: ["paymentMethod"],
} as const;

/* ---------- Payload API tạo đơn (server kiểm tra lại toàn bộ) ---------- */

export const orderLineSchema = z.object({
  kind: z.enum(["product", "custom-box"]),
  productId: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(businessConfig.stock.maxQuantityPerLine),
  colorTheme: z.string().min(1).max(32),
  customization: customizationSchema,
  box: z
    .object({
      sizeId: z.string().min(1).max(16),
      items: z
        .array(z.object({ itemId: z.string().min(1).max(64), quantity: z.number().int().min(1).max(20) }))
        .min(1)
        .max(30),
    })
    .optional(),
});

export const createOrderSchema = z.object({
  form: checkoutFormSchema,
  items: z.array(orderLineSchema).min(1, { message: "Giỏ hàng đang trống." }).max(50),
  couponCode: z.string().max(32).nullable(),
});

export type CreateOrderPayload = z.infer<typeof createOrderSchema>;

export const orderLookupSchema = z.object({
  code: z
    .string()
    .transform((v) => v.replace(/\s+/g, "").toUpperCase())
    .refine((v) => /^MO\d{10}$/.test(v), { message: "Mã đơn gồm chữ MO và 10 chữ số, ví dụ MO2610150123." }),
  phone: phoneField,
});

export const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "Bạn nhập email để nhận ưu đãi nhé." })
    .refine((v) => EMAIL_PATTERN.test(v), { message: "Email chưa đúng định dạng, ví dụ ban@gmail.com." }),
});

export const contactSchema = z.object({
  fullName: fullNameField,
  phone: phoneField,
  email: optionalEmailField,
  message: z
    .string()
    .trim()
    .min(10, { message: "Bạn viết thêm một chút để MÓ hiểu rõ hơn nhé (ít nhất 10 ký tự)." })
    .max(1000, { message: "Nội dung tối đa 1000 ký tự." }),
});

/* ---------- Tài khoản ---------- */

export const PASSWORD_MIN = 8;

export function validatePassword(value: string): string | null {
  if (!value) return "Bạn đặt mật khẩu giúp MÓ nhé.";
  if (value.length < PASSWORD_MIN) return `Mật khẩu cần ít nhất ${PASSWORD_MIN} ký tự.`;
  if (value.length > 100) return "Mật khẩu tối đa 100 ký tự.";
  if (!/\p{L}/u.test(value) || !/\d/.test(value)) return "Mật khẩu cần có cả chữ và số.";
  return null;
}

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, { message: "Bạn nhập email giúp MÓ nhé." })
  .max(100, { message: "Email tối đa 100 ký tự." })
  .refine((v) => EMAIL_PATTERN.test(v), { message: "Email chưa đúng định dạng, ví dụ ban@gmail.com." });

const newPasswordField = z.string().superRefine((v, ctx) => issue(ctx, validatePassword(v)));

export const registerSchema = z
  .object({
    fullName: fullNameField,
    email: emailField,
    phone: phoneField,
    password: newPasswordField,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { message: "Mật khẩu nhập lại chưa khớp.", path: ["confirmPassword"] });
export type RegisterValues = z.input<typeof registerSchema>;

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, { message: "Bạn nhập email hoặc số điện thoại nhé." }).max(100),
  password: z.string().min(1, { message: "Bạn nhập mật khẩu nhé." }).max(200),
});
export type LoginValues = z.input<typeof loginSchema>;

export const profileSchema = z.object({ fullName: fullNameField, phone: phoneField });
export type ProfileValues = z.input<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "Bạn nhập mật khẩu hiện tại nhé." }).max(200),
    newPassword: newPasswordField,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { message: "Mật khẩu nhập lại chưa khớp.", path: ["confirmPassword"] })
  .refine((v) => v.newPassword !== v.currentPassword, { message: "Mật khẩu mới cần khác mật khẩu hiện tại.", path: ["newPassword"] });
export type ChangePasswordValues = z.input<typeof changePasswordSchema>;

/* ---------- Vận chuyển (admin nhập) ---------- */

export const shipmentSchema = z
  .object({
    carrier: z.enum(CARRIER_IDS as [CarrierId, ...CarrierId[]]).nullable(),
    trackingCode: z
      .string()
      .trim()
      .max(50, { message: "Mã vận đơn tối đa 50 ký tự." })
      .refine((v) => v === "" || /^[A-Za-z0-9._-]+$/.test(v), { message: "Mã vận đơn chỉ gồm chữ, số và dấu . - _" }),
    shipperName: z.string().max(50, { message: "Tên shipper tối đa 50 ký tự." }),
    shipperPhone: z.string().superRefine((v, ctx) => issue(ctx, v.trim() ? validatePhone(v) : null)),
  })
  .refine((v) => !v.carrier || v.carrier === "shop" || v.carrier === "ahamove" || v.carrier === "grab" || v.trackingCode !== "", {
    message: "Bạn nhập mã vận đơn của hãng nhé.",
    path: ["trackingCode"],
  });
export type ShipmentPayload = z.output<typeof shipmentSchema>;
