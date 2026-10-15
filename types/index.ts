export type ColorThemeId = "hong" | "do" | "xanh-duong" | "xanh-la" | "vang" | "kraft" | "tim";
export type RecipientId = "ban-be" | "thay-co" | "nguoi-yeu" | "gia-dinh" | "dong-nghiep";
export type BadgeId = "ban-chay" | "moi" | "sap-het";
export type ShippingZone = "noi-thanh" | "ngoai-thanh";
export type PaymentMethod = "bank_transfer" | "cod";
export type PaymentStatus = "unpaid" | "paid" | "refunded";
export type OrderStatus = "pending" | "confirmed" | "preparing" | "shipping" | "delivered" | "cancelled";
export type SortOption = "moi-nhat" | "ban-chay" | "gia-tang" | "gia-giam";

export interface Dimensions {
  length: number;
  width: number;
  height: number;
}

export interface ProductContent {
  name: string;
  quantity: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  images: string[];
  occasions: string[];
  recipients: RecipientId[];
  colorThemes: ColorThemeId[];
  dimensions: Dimensions;
  contents: ProductContent[];
  isCustomizable: boolean;
  stock: number;
  badges: BadgeId[];
  rating?: number | null;
  soldCount: number;
  createdAt: string;
}

export interface Occasion {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  /** Ngày lặp lại hằng năm, null nếu dịp không cố định (sinh nhật, kỷ yếu…). */
  date?: { month: number; day: number } | null;
  coverImage: string;
}

export interface CardTemplate {
  id: string;
  name: string;
  background: string;
  ink: string;
  accent: string;
  pattern: "dots" | "hearts" | "snow" | "stripes" | "flowers" | "plain";
  occasions: string[];
}

export interface BoxItem {
  id: string;
  name: string;
  description: string;
  price: number;
  /** Số ô chiếm trong hộp. */
  size: number;
  stock: number;
  image: string;
  category: string;
}

export interface Customization {
  recipientName: string;
  message: string;
  cardTemplateId: string | null;
  handwrittenCard: boolean;
  premiumWrap: boolean;
}

export interface CustomBoxSelection {
  sizeId: string;
  items: { itemId: string; name: string; quantity: number; price: number; size: number }[];
}

export interface CartItem {
  /** Mã dòng giỏ hàng (khác productId vì một sản phẩm có thể có nhiều cách cá nhân hoá). */
  lineId: string;
  kind: "product" | "custom-box";
  productId: string;
  slug: string;
  name: string;
  image: string;
  quantity: number;
  maxQuantity: number;
  colorTheme: ColorThemeId;
  customization: Customization;
  unitPrice: number;
  compareAtPrice?: number | null;
  box?: CustomBoxSelection;
}

export type CouponType = "percent" | "fixed";

export interface Coupon {
  code: string;
  type: CouponType;
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  startsAt: string;
  endsAt: string;
  usageLimit: number;
  usedCount: number;
  description: string;
}

export interface Ward {
  id: string;
  name: string;
  zone?: ShippingZone;
}

export interface Province {
  id: string;
  name: string;
  wards: Ward[];
}

export interface Address {
  provinceId: string;
  provinceName: string;
  wardId: string | null;
  wardName: string;
  street: string;
  note?: string | null;
}

export interface Contact {
  fullName: string;
  phone: string;
  email?: string | null;
}

export interface Surcharges {
  handwrittenCard: number;
  premiumWrap: number;
  expressDelivery: number;
}

export interface OrderItem {
  kind: CartItem["kind"];
  productId: string | null;
  slug: string | null;
  name: string;
  image: string;
  colorTheme: ColorThemeId;
  quantity: number;
  unitPrice: number;
  customization: Customization;
  box?: CustomBoxSelection | null;
}

export interface OrderEvent {
  status: OrderStatus;
  note?: string | null;
  createdAt: string;
}

export interface Order {
  code: string;
  customer: Contact;
  recipient: Contact;
  address: Address;
  zone: ShippingZone;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode: string | null;
  shippingFee: number;
  surcharges: Surcharges;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  preferredDate: string | null;
  hidePrice: boolean;
  express: boolean;
  createdAt: string;
  expectedDeliveryDate: { from: string; to: string };
  events: OrderEvent[];
}

export interface ProductFilters {
  occasions: string[];
  budget: string | null;
  colors: ColorThemeId[];
  recipients: RecipientId[];
  sort: SortOption;
  q: string;
}
