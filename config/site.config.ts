/**
 * FILE CẤU HÌNH DUY NHẤT CHO TOÀN BỘ GIÁ TRỊ KINH DOANH.
 *
 * Mọi giá trị đánh dấu [[...]] trong đề bài đều nằm ở đây. Chủ shop chỉ cần sửa file này
 * (giá tiền tính bằng đồng, không có dấu chấm) rồi khởi động lại server.
 * Mã giảm giá nằm trong data/coupons.json (được nạp vào database khi chạy `npm run db:seed`).
 */

export const siteConfig = {
  name: "MÓ Gift Box",
  shortName: "MÓ",
  tagline: "Gói trọn yêu thương trong từng hộp quà",
  description:
    "MÓ Gift Box – hộp quà kraft gói tay với bánh kẹo, thiệp và lời chúc riêng cho người bạn thương. Chọn quà theo dịp, theo ngân sách, giao nhanh toàn quốc.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "vi_VN",

  /** Thanh thông báo trên cùng. Để chuỗi rỗng nếu muốn ẩn. */
  announcement: "Freeship cho đơn từ 299.000đ · Gói quà thủ công, giao nhanh trong ngày tại TP.HCM",

  contact: {
    hotline: "[[0900 000 000]]",
    hotlineTel: "0900000000", // [[số dùng cho link gọi điện, không có khoảng trắng]]
    email: "[[hello@mogiftbox.vn]]",
    zalo: "https://zalo.me/0900000000", // [[link Zalo OA hoặc Zalo cá nhân]]
    facebook: "https://facebook.com/", // [[link Fanpage]]
    messenger: "https://m.me/", // [[link Messenger của Fanpage]]
    instagram: "https://instagram.com/", // [[link Instagram]]
    tiktok: "https://tiktok.com/", // [[link TikTok]]
    address: "[[Số nhà, đường, phường, TP.HCM]]",
    workingHours: "[[8:00 – 21:00, tất cả các ngày trong tuần]]",
  },

  /** Thông tin nhận chuyển khoản. bankId là mã BIN ngân hàng theo chuẩn VietQR. */
  bank: {
    bankId: "970436", // [[BIN ngân hàng – 970436 là Vietcombank]]
    bankName: "[[Vietcombank]]",
    accountNumber: "[[0000000000]]",
    accountName: "[[NGUYEN VAN A]]",
  },
} as const;

export const businessConfig = {
  /** Mốc giá gói quà dùng cho "Chọn quà theo ngân sách". max = null nghĩa là không giới hạn trên. */
  budgets: [
    { id: "59k", label: "59.000đ", hint: "Quà nhỏ xinh", min: 0, max: 59_000 },
    { id: "99k", label: "99.000đ", hint: "Vừa túi sinh viên", min: 59_001, max: 99_000 },
    { id: "149k", label: "149.000đ", hint: "Chỉn chu, đủ đầy", min: 99_001, max: 149_000 },
    { id: "199k", label: "199.000đ", hint: "Món quà đáng nhớ", min: 149_001, max: 199_000 },
    { id: "tren-199k", label: "Trên 199.000đ", hint: "Cho dịp thật đặc biệt", min: 199_001, max: null },
  ],

  shipping: {
    /** Tỉnh/thành nơi shop đặt kho. Phường có zone "noi-thanh" trong data/addresses.json được tính phí nội thành. */
    shopProvinceId: "ho-chi-minh",
    innerCityFee: 20_000,
    outerFee: 35_000,
    /** Miễn phí vận chuyển khi tiền hàng (sau giảm giá, chưa gồm phụ phí) đạt mốc này. */
    freeShippingThreshold: 299_000,
  },

  surcharges: {
    /** Tính trên mỗi hộp. */
    handwrittenCard: 10_000,
    /** Tính trên mỗi hộp. */
    premiumWrap: 15_000,
    /** Tính một lần cho cả đơn, chỉ áp dụng khu vực nội thành. */
    expressDelivery: 30_000,
  },

  delivery: {
    timezone: "Asia/Ho_Chi_Minh",
    innerCityDays: { min: 1, max: 2 },
    otherDays: { min: 3, max: 5 },
    /** Đơn đặt từ giờ này trở đi được tính sang ngày hôm sau. */
    cutoffHour: 17,
    /** Khách được chọn ngày giao mong muốn trong khoảng bao nhiêu ngày tới. */
    maxPreferredDays: 30,
  },

  customization: {
    recipientNameMax: 30,
    messageMax: 150,
  },

  /** Tự thiết kế hộp quà: giá nền và sức chứa (số ô) cho từng kích thước. */
  boxBuilder: {
    sizes: [
      { id: "nho", name: "Hộp Nhỏ", basePrice: 39_000, capacity: 4, dimensions: { length: 15, width: 15, height: 8 } },
      { id: "vua", name: "Hộp Vừa", basePrice: 59_000, capacity: 7, dimensions: { length: 20, width: 20, height: 10 } },
      { id: "lon", name: "Hộp Lớn", basePrice: 89_000, capacity: 10, dimensions: { length: 26, width: 26, height: 12 } },
    ],
    image: "/images/products/tu-thiet-ke-1.svg",
  },

  stock: {
    /** Còn ít hơn hoặc bằng số này thì hiển thị nhãn "Sắp hết". */
    lowStockThreshold: 5,
    maxQuantityPerLine: 20,
  },

  order: {
    codePrefix: "MO",
  },
} as const;

export type BudgetId = (typeof businessConfig.budgets)[number]["id"];
export type BoxSizeId = (typeof businessConfig.boxBuilder.sizes)[number]["id"];
