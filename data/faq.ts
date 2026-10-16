import { businessConfig, siteConfig } from "@/config/site.config";
import { formatVND } from "@/lib/format";

const { shipping, surcharges, delivery, customization } = businessConfig;

export interface FaqGroup {
  id: string;
  title: string;
  items: { q: string; a: string }[];
}

/** Câu hỏi thường gặp. Giá trị tiền, thời gian lấy từ config nên luôn khớp với thực tế. */
export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: "dat-hang",
    title: "Đặt hàng",
    items: [
      { q: "Mình có cần tạo tài khoản để đặt hàng không?", a: "Không cần đâu. Bạn chỉ cần nhập họ tên, số điện thoại và địa chỉ là đặt được ngay trong 3 bước." },
      { q: "Đặt hàng xong mình theo dõi đơn ở đâu?", a: "Bạn vào trang Tra cứu đơn hàng, nhập mã đơn (dạng MO2610150123) và số điện thoại đặt hàng để xem quà đang ở bước nào." },
      { q: "Mình muốn đổi địa chỉ hoặc lời chúc sau khi đặt thì sao?", a: `Bạn gọi hotline ${siteConfig.contact.hotline} hoặc nhắn Zalo cho MÓ kèm mã đơn. MÓ hỗ trợ sửa miễn phí khi đơn chưa chuyển sang trạng thái "Đang chuẩn bị".` },
      { q: "Mua số lượng lớn cho lớp, công ty có được giảm giá không?", a: "Có nhé. Đơn từ [[20]] hộp trở lên, bạn liên hệ MÓ để nhận báo giá riêng và in thiệp theo yêu cầu." },
    ],
  },
  {
    id: "thanh-toan",
    title: "Thanh toán",
    items: [
      { q: "MÓ nhận những hình thức thanh toán nào?", a: "Bạn có thể chuyển khoản ngân hàng bằng mã VietQR hoặc thanh toán tiền mặt khi nhận hàng (COD)." },
      { q: "Chuyển khoản xong bao lâu thì MÓ xác nhận?", a: "Trong vòng [[30 phút]] vào giờ làm việc. Bạn nhớ ghi đúng nội dung chuyển khoản là mã đơn để MÓ đối soát nhanh." },
      { q: "Mỗi đơn dùng được mấy mã giảm giá?", a: "Mỗi đơn áp dụng một mã. Mã chỉ trừ vào tiền hàng, không trừ phí vận chuyển và phụ phí." },
    ],
  },
  {
    id: "giao-hang",
    title: "Giao hàng",
    items: [
      { q: "Phí vận chuyển là bao nhiêu?", a: `Nội thành: ${formatVND(shipping.innerCityFee)}. Ngoại thành và tỉnh khác: ${formatVND(shipping.outerFee)}. Miễn phí cho đơn có tiền hàng từ ${formatVND(shipping.freeShippingThreshold)} (sau giảm giá).` },
      { q: "Bao lâu thì quà đến nơi?", a: `Nội thành ${delivery.innerCityDays.min}–${delivery.innerCityDays.max} ngày, tỉnh khác ${delivery.otherDays.min}–${delivery.otherDays.max} ngày. Đơn đặt sau ${delivery.cutoffHour}:00 được tính từ ngày hôm sau.` },
      { q: "Mình cần quà gấp trong hôm nay được không?", a: `Được nếu bạn ở nội thành. Chọn "Giao nhanh trong ngày" (+${formatVND(surcharges.expressDelivery)}) ở bước thanh toán và đặt trước ${delivery.cutoffHour}:00.` },
      { q: "Mình có thể hẹn ngày giao cụ thể không?", a: `Có. Ở bước thông tin giao hàng, bạn chọn ngày giao mong muốn trong vòng ${delivery.maxPreferredDays} ngày tới.` },
      { q: "Mình không muốn người nhận biết giá tiền?", a: 'Bạn tick "Giấu giá trên hoá đơn" khi thanh toán, phiếu giao hàng sẽ không in giá.' },
    ],
  },
  {
    id: "doi-tra",
    title: "Đổi trả",
    items: [
      { q: "Hộp quà bị móp, hỏng khi nhận thì sao?", a: "Bạn chụp ảnh hoặc quay video lúc mở hộp và báo MÓ trong vòng [[24 giờ]]. MÓ sẽ đổi hộp mới hoặc hoàn tiền phần hư hỏng." },
      { q: "Mình đổi ý không muốn mua nữa có được huỷ đơn không?", a: 'Bạn huỷ miễn phí khi đơn chưa sang trạng thái "Đang chuẩn bị". Hộp quà đã cá nhân hoá (in tên, lời chúc) sẽ không áp dụng đổi trả vì lý do cá nhân.' },
      { q: "Hoàn tiền mất bao lâu?", a: "MÓ hoàn tiền qua chuyển khoản trong [[3–5 ngày làm việc]] sau khi xác nhận." },
    ],
  },
  {
    id: "ca-nhan-hoa",
    title: "Cá nhân hoá",
    items: [
      { q: "Lời chúc được viết tối đa bao nhiêu chữ?", a: `Tối đa ${customization.messageMax} ký tự và tên người nhận tối đa ${customization.recipientNameMax} ký tự. Bạn sẽ thấy bộ đếm ký tự ngay khi gõ.` },
      { q: "Thiệp in và thiệp viết tay khác gì nhau?", a: `Thiệp in miễn phí, lời chúc in theo mẫu bạn chọn. Thiệp viết tay (+${formatVND(surcharges.handwrittenCard)}) được MÓ viết bằng bút mực, ấm áp hơn.` },
      { q: "Gói quà cao cấp gồm những gì?", a: `Thêm giấy lụa, ruy băng vải và hoa khô trang trí trên nắp hộp, phụ phí ${formatVND(surcharges.premiumWrap)} mỗi hộp.` },
      { q: "Mình có thể tự chọn từng món trong hộp không?", a: "Có! Bạn vào trang Tự thiết kế, chọn kích thước hộp rồi chọn từng món bánh kẹo, phụ kiện theo ý mình." },
    ],
  },
];
