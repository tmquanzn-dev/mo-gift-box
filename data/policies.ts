import { businessConfig, siteConfig } from "@/config/site.config";
import { formatVND } from "@/lib/format";

/**
 * KHUNG NỘI DUNG CHÍNH SÁCH – chủ shop cần đọc lại và điền các chỗ [[...]].
 * Nội dung mang tính tham khảo, nên được rà soát cho phù hợp quy định pháp luật hiện hành.
 */
export interface PolicySection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface Policy {
  slug: string;
  title: string;
  description: string;
  updatedAt: string;
  sections: PolicySection[];
}

const { shipping, delivery, surcharges } = businessConfig;
const { contact } = siteConfig;

export const POLICIES: Policy[] = [
  {
    slug: "doi-tra",
    title: "Chính sách đổi trả & hoàn tiền",
    description: "Điều kiện đổi trả, thời hạn và cách MÓ hoàn tiền cho bạn.",
    updatedAt: "[[15/10/2026]]",
    sections: [
      {
        heading: "1. Trường hợp được đổi trả",
        bullets: [
          "Hộp quà bị móp, rách, hư hỏng trong quá trình vận chuyển.",
          "Giao sai sản phẩm, sai chủ đề màu, thiếu món so với mô tả.",
          "Sai thông tin cá nhân hoá (tên, lời chúc) do lỗi của MÓ.",
          "Bánh kẹo hết hạn sử dụng hoặc có dấu hiệu hư hỏng khi nhận.",
        ],
      },
      {
        heading: "2. Trường hợp không áp dụng",
        bullets: [
          "Hộp quà đã cá nhân hoá theo yêu cầu nhưng khách đổi ý vì lý do cá nhân.",
          "Sản phẩm đã sử dụng, đã ăn một phần hoặc không còn nguyên vẹn do người nhận bảo quản.",
          "Yêu cầu gửi sau thời hạn quy định tại mục 3.",
        ],
      },
      {
        heading: "3. Thời hạn & cách gửi yêu cầu",
        paragraphs: [
          `Bạn báo MÓ trong vòng [[24 giờ]] kể từ khi nhận hàng qua hotline ${contact.hotline}, Zalo hoặc email ${contact.email}.`,
          "Vui lòng gửi kèm mã đơn hàng và ảnh chụp hoặc video mở hộp để MÓ xử lý nhanh nhất.",
        ],
      },
      {
        heading: "4. Hình thức xử lý",
        bullets: [
          "Gửi lại hộp quà mới cùng mẫu, miễn phí vận chuyển.",
          "Hoặc hoàn tiền phần sản phẩm bị lỗi theo thoả thuận.",
          "Huỷ đơn trước khi đơn chuyển sang trạng thái “Đang chuẩn bị”: hoàn 100% số tiền đã thanh toán.",
        ],
      },
      {
        heading: "5. Thời gian hoàn tiền",
        paragraphs: ["MÓ hoàn tiền qua chuyển khoản ngân hàng trong [[3–5 ngày làm việc]] kể từ khi xác nhận yêu cầu hợp lệ."],
      },
    ],
  },
  {
    slug: "hang-loi",
    title: "Xử lý hàng lỗi, hư hỏng khi vận chuyển",
    description: "Các bước MÓ hỗ trợ khi hộp quà đến tay bạn không còn nguyên vẹn.",
    updatedAt: "[[15/10/2026]]",
    sections: [
      {
        heading: "1. Kiểm tra khi nhận hàng",
        paragraphs: ["Người nhận nên kiểm tra tình trạng bên ngoài hộp trước khi ký nhận. Nếu hộp móp méo nặng, bạn có thể từ chối nhận và báo ngay cho MÓ."],
      },
      {
        heading: "2. Ghi nhận lỗi",
        bullets: ["Quay video hoặc chụp ảnh lúc mở hộp.", "Chụp rõ phiếu giao hàng có mã đơn.", `Gửi cho MÓ trong vòng [[24 giờ]] qua Zalo hoặc hotline ${contact.hotline}.`],
      },
      {
        heading: "3. Cam kết của MÓ",
        paragraphs: [
          "MÓ chịu toàn bộ chi phí gửi lại hộp mới với lỗi phát sinh trong quá trình vận chuyển.",
          "Với dịp quan trọng (sinh nhật, lễ), MÓ ưu tiên giao lại bằng hình thức giao nhanh nếu người nhận ở nội thành.",
        ],
      },
      {
        heading: "4. Đơn vị vận chuyển",
        paragraphs: ["[[Tên đơn vị vận chuyển đối tác]] chịu trách nhiệm theo hợp đồng với MÓ. Khách hàng không cần làm việc trực tiếp với đơn vị vận chuyển."],
      },
    ],
  },
  {
    slug: "van-chuyen",
    title: "Chính sách vận chuyển",
    description: "Phí ship, thời gian giao, giao nhanh và hẹn ngày giao.",
    updatedAt: "[[15/10/2026]]",
    sections: [
      {
        heading: "1. Phạm vi giao hàng",
        paragraphs: ["MÓ giao hàng toàn quốc. Kho hàng đặt tại [[TP. Hồ Chí Minh]]."],
      },
      {
        heading: "2. Phí vận chuyển",
        bullets: [
          `Nội thành: ${formatVND(shipping.innerCityFee)} / đơn.`,
          `Ngoại thành và tỉnh khác: ${formatVND(shipping.outerFee)} / đơn.`,
          `Miễn phí vận chuyển cho đơn có tiền hàng từ ${formatVND(shipping.freeShippingThreshold)} (tính sau giảm giá, chưa gồm phụ phí).`,
          `Giao nhanh trong ngày (chỉ nội thành): +${formatVND(surcharges.expressDelivery)} / đơn.`,
        ],
      },
      {
        heading: "3. Thời gian giao dự kiến",
        bullets: [
          `Nội thành: ${delivery.innerCityDays.min}–${delivery.innerCityDays.max} ngày.`,
          `Tỉnh khác: ${delivery.otherDays.min}–${delivery.otherDays.max} ngày.`,
          `Đơn đặt sau ${delivery.cutoffHour}:00 được tính sang ngày hôm sau.`,
          "Dịp lễ cao điểm (20/10, 20/11, Giáng sinh, Valentine) thời gian có thể kéo dài thêm [[1 ngày]].",
        ],
      },
      {
        heading: "4. Hẹn ngày giao & giấu giá",
        paragraphs: [
          `Bạn có thể chọn ngày giao mong muốn trong vòng ${delivery.maxPreferredDays} ngày tới. Tuỳ chọn “Giấu giá trên hoá đơn” giúp phiếu giao hàng không in giá tiền.`,
        ],
      },
    ],
  },
  {
    slug: "bao-mat",
    title: "Chính sách bảo mật thông tin cá nhân",
    description: "MÓ thu thập, sử dụng và bảo vệ thông tin của bạn như thế nào.",
    updatedAt: "[[15/10/2026]]",
    sections: [
      {
        heading: "1. Thông tin MÓ thu thập",
        bullets: ["Họ tên, số điện thoại, email (không bắt buộc) của người đặt.", "Họ tên, số điện thoại, địa chỉ của người nhận.", "Nội dung lời chúc, tên người nhận in trên thiệp."],
      },
      {
        heading: "2. Mục đích sử dụng",
        bullets: ["Xử lý, giao đơn hàng và liên hệ khi cần.", "Gửi ưu đãi qua email nếu bạn đăng ký nhận tin (có thể huỷ bất cứ lúc nào).", "MÓ không bán hay chia sẻ thông tin cho bên thứ ba ngoài đơn vị vận chuyển."],
      },
      {
        heading: "3. Lưu trữ & bảo vệ",
        paragraphs: [
          "Thông tin được lưu trên máy chủ [[tên nhà cung cấp hạ tầng]] và chỉ nhân sự xử lý đơn mới được truy cập.",
          "Trang chi tiết đơn hàng chỉ hiển thị khi có đúng mã đơn và số điện thoại.",
          "Giỏ hàng được lưu ngay trên trình duyệt của bạn (localStorage), không gửi lên máy chủ cho đến khi bạn đặt hàng.",
        ],
      },
      {
        heading: "4. Quyền của bạn",
        paragraphs: [`Bạn có quyền yêu cầu xem, sửa hoặc xoá thông tin cá nhân bằng cách liên hệ ${contact.email}. MÓ phản hồi trong vòng [[7 ngày làm việc]].`],
      },
      {
        heading: "5. Đơn vị chịu trách nhiệm",
        paragraphs: ["[[Tên hộ kinh doanh / doanh nghiệp]] · [[Mã số thuế]] · [[Địa chỉ đăng ký kinh doanh]]"],
      },
    ],
  },
];

export function getPolicy(slug: string): Policy | undefined {
  return POLICIES.find((p) => p.slug === slug);
}
