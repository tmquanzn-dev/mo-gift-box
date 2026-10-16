# MÓ Gift Box

Đây là website bán hộp quà mình làm cho MÓ Gift Box, một shop nhỏ gói quà thủ công ở TP.HCM. Khách vào web chọn quà theo dịp (20/10, 20/11, Giáng sinh, sinh nhật...) hoặc theo số tiền muốn chi, viết lời chúc, chọn thiệp rồi đặt hàng. Ai không thích tạo tài khoản thì vẫn đặt được như khách vãng lai. Chủ shop vào trang `/admin` để xem đơn, đổi trạng thái và nhập thông tin vận chuyển.

Mình dùng Next.js 16 (App Router) với React 19 và TypeScript, giao diện viết bằng Tailwind CSS v4. Giỏ hàng lưu bằng Zustand, form dùng React Hook Form và Zod. Phần backend nằm luôn trong Next.js (Route Handlers), dữ liệu lưu bằng Prisma + SQLite cho dễ chạy trên máy. Muốn đổi sang PostgreSQL thì chỉ cần sửa `provider` trong `prisma/schema.prisma` và `DATABASE_URL`.

## Chạy thử trên máy

Cần Node.js 20.9 trở lên. Mình chạy bằng Node 24.

```bash
npm install
cp .env.example .env     # trên Windows: copy .env.example .env
npm run setup            # tạo database, nạp dữ liệu mẫu, sinh ảnh minh hoạ
npm run dev
```

Sau đó mở http://localhost:3000.

Trước khi chạy `setup`, nhớ mở file `.env` sửa 3 giá trị: `APP_SECRET` (chuỗi ngẫu nhiên dài, dùng để ký cookie), `ADMIN_EMAIL` và `ADMIN_PASSWORD` (tài khoản admin sẽ được tạo từ hai giá trị này). Trong `.env.example` có sẵn lệnh tạo `APP_SECRET`.

Nếu dùng npm 11 mà bị chặn script cài đặt của Prisma hoặc esbuild, chạy thêm:

```bash
npm install-scripts approve @prisma/client @prisma/engines prisma esbuild
npm rebuild
```

**Lưu ý về tốc độ:** chạy `npm run dev` thì lần đầu mở mỗi trang sẽ mất vài giây vì Next.js phải biên dịch, các lần sau mới nhanh. Lúc demo nên chạy bản production cho mượt:

```bash
npm run build
npm start
```

Mấy lệnh còn lại hay dùng:

- `npm test`: chạy unit test
- `npm run typecheck` và `npm run lint`: kiểm tra code
- `npm run db:seed`: nạp lại sản phẩm, dịp, mã giảm giá từ thư mục `data/`. Lệnh này không đụng tới đơn hàng và tài khoản đã có.
- `npm run db:reset`: xoá sạch database rồi nạp lại từ đầu (cẩn thận, mất hết đơn)
- `npm run db:studio`: mở Prisma Studio để xem và sửa dữ liệu bằng giao diện
- `npm run admin:create -- email@cua-ban.vn MatKhauMoi123`: tạo tài khoản admin mới hoặc đặt lại mật khẩu admin

## Tài khoản và trang admin

Khách đăng ký ở `/dang-ky` và đăng nhập ở `/dang-nhap`, dùng email hoặc số điện thoại đều được. Khi đã đăng nhập, khách vào `/tai-khoan` để xem lại các đơn đã đặt, sửa tên và số điện thoại, hoặc đổi mật khẩu. Ở trang thanh toán, thông tin người đặt cũng được điền sẵn.

Admin cũng đăng nhập ở `/dang-nhap` như khách, chỉ khác là tài khoản có `role = "admin"`. Đăng nhập xong web tự chuyển vào `/admin/don-hang`. Tài khoản khách thường không vào được trang này. Tài khoản admin đầu tiên do `npm run db:seed` tạo từ `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Nếu sau này đổi mật khẩu trên web thì chạy seed lại cũng không bị ghi đè.

Về bảo mật đăng nhập, mình làm mấy việc sau:

- Mật khẩu được băm bằng scrypt (có sẵn trong Node) trước khi lưu.
- Cookie `mo_session` chỉ chứa một token ngẫu nhiên. Trong database (bảng `Session`) chỉ lưu SHA-256 của token đó, nên lộ database cũng không dùng lại được phiên đăng nhập.
- Đổi mật khẩu thì các thiết bị khác bị đăng xuất.
- Mỗi tài khoản chỉ được nhập sai 5 lần trong 15 phút. Giới hạn tính theo tài khoản chứ không theo IP, nên đổi IP cũng không dò mật khẩu được.

## Theo dõi đơn hàng

Mình làm phần này theo kiểu Shopee, nhưng ở mức đơn giản. Khi giao hàng, admin mở đơn trong `/admin/don-hang/<mã đơn>`, vào mục "Vận chuyển" chọn hãng (GHN, GHTK, J&T, Viettel Post, Ahamove, GrabExpress hoặc shipper của shop), nhập mã vận đơn, và tên với số điện thoại shipper nếu có.

Khách mở trang tra cứu đơn (hoặc bấm vào đơn trong lịch sử tài khoản) sẽ thấy:

- thanh tiến trình 5 bước: đã đặt, đã xác nhận, đang chuẩn bị, đang giao, đã giao
- hãng vận chuyển và mã vận đơn, có nút sao chép mã
- nút "Theo dõi hành trình" mở trang tra cứu của hãng, và nút gọi shipper
- lịch sử cập nhật, mới nhất ở trên, kèm ghi chú admin nhập ở từng bước

Với GHN và GHTK, link mở ra đã có sẵn mã vận đơn. Với J&T và Viettel Post, link chỉ mở trang tra cứu, khách phải dán mã vào. Mình chưa thử các link này với mã vận đơn thật, nên nếu hãng nào đổi đường dẫn thì sửa trong `lib/carriers.ts`.

Web chưa tự lấy được trạng thái từ hãng vận chuyển, admin vẫn phải cập nhật tay. Muốn tự động thì phải kết nối API của GHN hoặc GHTK (xem phần "Định làm tiếp").

## Sửa giá, phí ship, mã giảm giá

Hầu hết các con số kinh doanh nằm chung trong một file là `config/site.config.ts`. Giá ghi bằng đồng, ví dụ `20_000` là 20.000đ. Sửa xong thì khởi động lại server.

| Cái cần sửa | Chỗ sửa | Hiện đang để |
|---|---|---|
| Các mốc ngân sách | `businessConfig.budgets` | 59k, 99k, 149k, 199k, trên 199k |
| Phí ship | `shipping.innerCityFee`, `outerFee` | 20.000đ nội thành, 35.000đ nơi khác |
| Freeship | `shipping.freeShippingThreshold` | từ 299.000đ (tính trên tiền hàng sau khi giảm giá) |
| Thiệp viết tay, gói cao cấp | `surcharges.handwrittenCard`, `premiumWrap` | +10.000đ, +15.000đ mỗi hộp |
| Giao nhanh trong ngày | `surcharges.expressDelivery` | +30.000đ mỗi đơn, chỉ nội thành |
| Thời gian giao | `delivery.innerCityDays`, `otherDays` | 1–2 ngày, 3–5 ngày |
| Giờ chốt đơn | `delivery.cutoffHour` | 17h, đặt sau giờ này tính sang hôm sau |
| Độ dài tên người nhận, lời chúc | `customization.recipientNameMax`, `messageMax` | 30 và 150 ký tự |
| Hộp tự thiết kế | `boxBuilder.sizes` | nhỏ 39k (4 ô), vừa 59k (7 ô), lớn 89k (10 ô) |
| Liên hệ, tài khoản ngân hàng | `siteConfig.contact`, `siteConfig.bank` | đang để `[[...]]`, cần điền thật |

Khi điền số tài khoản thật vào `siteConfig.bank`, trang xác nhận đơn sẽ tự hiện mã VietQR, có sẵn số tiền và nội dung chuyển khoản là mã đơn.

Mã giảm giá nằm trong `data/coupons.json`. Mỗi mã có dạng như sau:

```json
{
  "code": "MOYEU20",
  "type": "percent",
  "value": 20,
  "minOrder": 199000,
  "maxDiscount": 40000,
  "startsAt": "2026-10-01T00:00:00+07:00",
  "endsAt": "2026-12-31T23:59:59+07:00",
  "usageLimit": 200,
  "isFeatured": true
}
```

`type` là `"percent"` (giảm theo %) hoặc `"fixed"` (giảm số tiền cố định). `maxDiscount` để `null` nếu không giới hạn. Mã nào có `isFeatured: true` thì hiện trên banner trang chủ. Sửa xong chạy `npm run db:seed`, số lượt đã dùng vẫn giữ nguyên. Mỗi đơn chỉ dùng được một mã, và mã chỉ trừ vào tiền hàng, không trừ phí ship hay phụ phí. Huỷ đơn thì lượt dùng mã được trả lại.

Trong dữ liệu mẫu có 4 mã: `MOYEU20` và `GIAM15K` đang dùng được, `THAYCO10` chưa tới ngày, `HE2026` đã hết hạn. Hai mã sau mình để lại để thử các thông báo lỗi.

Sản phẩm, các dịp và món lẻ cho hộp tự thiết kế nằm trong `data/products.json`, `data/occasions.json` và `data/box-items.json`. Sửa xong cũng chạy `npm run db:seed`. Hiện admin chưa có trang quản lý sản phẩm, nên tạm thời phải sửa ở đây.

Địa chỉ giao hàng (`data/addresses.json`) theo kiểu 2 cấp tỉnh/thành và phường/xã, áp dụng từ 01/7/2025, có đủ 34 tỉnh thành. Danh sách phường thì mình mới nhập một phần cho 6 thành phố lớn, ở các tỉnh khác khách tự gõ tên phường. Trước khi bán thật nên thay bằng bộ dữ liệu đầy đủ, giữ cấu trúc `{ id, name, zone }`. Phường có `"zone": "noi-thanh"` sẽ tính phí nội thành và được chọn giao nhanh.

## Thay ảnh thật

Ảnh hiện tại đều là ảnh SVG minh hoạ, trên ảnh có ghi "Thay bằng ảnh thật". Cách thay:

1. Chụp ảnh vuông, khoảng 1200×1200, JPG hoặc WebP dưới 300KB. Mỗi sản phẩm nên có 3 tấm: hộp đóng, hộp mở và cận cảnh đồ bên trong.
2. Đặt vào `public/images/products/<slug>-1.jpg`, `-2.jpg`, `-3.jpg`.
3. Trong `prisma/seed.ts`, đổi đuôi `.svg` thành `.jpg` ở dòng `images: JSON.stringify([...])`, rồi chạy `npm run db:seed`.

Ảnh lớn ở trang chủ là `public/images/hero.svg`. Ảnh các dịp nằm trong `public/images/occasions/`, ảnh món lẻ trong `public/images/items/`, ảnh minh hoạ các bước mua hàng trong `public/images/steps/`. Đổi ảnh nào thì sửa đường dẫn tương ứng trong `app/page.tsx` hoặc `data/*.json`. Ảnh JPG/WebP sẽ được `next/image` tự resize và nén.

Ngoài ảnh còn vài chỗ cần điền nội dung thật: phần đánh giá khách hàng ở trang chủ, nội dung chính sách trong `data/policies.ts` và câu hỏi thường gặp trong `data/faq.ts`. Mấy chỗ `[[...]]` trên trang chính sách được tô vàng cho dễ thấy.

## Code được tổ chức thế nào

```
app/                    các trang và API (app/api/*)
  api/orders            tạo đơn, server tự tính lại tiền
  api/orders/lookup     tra cứu đơn bằng mã đơn + số điện thoại
  api/coupons/validate  kiểm tra mã giảm giá
  api/products          gợi ý khi gõ ô tìm kiếm
  api/auth/*            đăng ký, đăng nhập, đăng xuất, sửa hồ sơ, đổi mật khẩu
  api/admin/orders/*    admin đổi trạng thái đơn, thanh toán, vận chuyển
components/ui/          component dùng chung: nút, ô nhập, badge, modal, drawer, toast...
components/features/    component theo từng phần: layout, sản phẩm, giỏ hàng, thanh toán, đơn hàng, tài khoản, admin
config/site.config.ts   các con số kinh doanh (giá, phí ship, thời gian giao...)
data/                   dữ liệu mẫu và nội dung chính sách, FAQ
lib/                    hàm dùng chung cho cả client và server: tính tiền, mã giảm giá, ngày giao, validate, hãng vận chuyển...
services/               chỗ duy nhất đọc/ghi database
server/                 Prisma client, phiên đăng nhập, phân quyền, rate limit
store/                  giỏ hàng (Zustand, lưu localStorage)
prisma/                 schema và file seed
tests/                  unit test
```

Có vài điều mình cố giữ khi viết:

- **Server không tin giá client gửi lên.** Lúc tạo đơn, server tự lấy giá trong database, kiểm tra tồn kho, sức chứa hộp tự thiết kế, mã giảm giá, khu vực và ngày giao, rồi trừ kho và lưu đơn trong cùng một transaction. Client và server dùng chung `lib/pricing.ts` nên số tiền khách thấy luôn khớp với số tiền thật.
- **Không để lộ thông tin người nhận.** Trang chi tiết đơn `/dat-hang-thanh-cong/[mã]` chỉ hiện đầy đủ cho trình duyệt vừa đặt đơn, chủ tài khoản của đơn hoặc admin. Người khác có link phải nhập đúng số điện thoại ở trang tra cứu mới xem được.
- **Có giới hạn số lần gọi** với các API tạo đơn, tra cứu, mã giảm giá, đăng ký và đăng nhập. Bộ đếm đang lưu trong bộ nhớ, đủ cho một server. Nếu chạy nhiều server thì phải chuyển sang Redis.
- **Bộ lọc cửa hàng nằm trên URL**, ví dụ `/cua-hang?dip=20-10&gia=99k&mau=hong`, nên gửi link cho người khác vẫn ra đúng kết quả, và Google cũng đọc được.

Màu sắc, font chữ, bo góc, đổ bóng đều để trong `app/globals.css` (phần `@theme`). Mình có đo độ tương phản và thêm 3 màu đậm hơn để chữ dễ đọc theo chuẩn WCAG AA: `accent-strong #C13B22` cho nút chính và giá khuyến mãi, `text-muted #6E5E52` cho chữ phụ, `border-strong #9C7A56` cho viền ô nhập. Màu gốc của thương hiệu vẫn giữ để trang trí.

## Đã kiểm tra những gì

- 41 unit test (`npm test`), gồm: tính tiền, freeship, phụ phí, giao nhanh, các trường hợp mã giảm giá không hợp lệ, giờ chốt đơn 17h theo giờ Việt Nam, mã đơn, số điện thoại, họ tên, lời chúc, bộ lọc trên URL, mã hoá mật khẩu, form đăng ký/đăng nhập và link theo dõi vận chuyển.
- Mình thử tay qua API: tạo đơn đúng tiền và từ chối các đơn sai (số điện thoại sai, giao nhanh ngoài nội thành, hộp quá đầy, hết hàng, mã chưa đủ điều kiện, ngày giao quá sớm). Mình cũng thử đăng ký, đăng nhập, đổi mật khẩu, phân quyền admin, và chặn việc nhảy trạng thái đơn sai thứ tự.
- Mình thử trên trình duyệt ở cả màn hình máy tính lẫn điện thoại 375px: đặt hàng từ trang sản phẩm tới trang xác nhận, làm hộp tự thiết kế, trang tra cứu đơn có thông tin vận chuyển. Các trang chính không bị cuộn ngang.

Chưa làm: đo Lighthouse và test E2E tự động bằng Playwright.

## Định làm tiếp

1. Trang admin để quản lý sản phẩm, mã giảm giá, tồn kho, thay cho việc sửa file JSON. Ảnh sản phẩm thì upload lên Cloudinary hoặc S3.
2. Kết nối API của GHN hoặc GHTK: admin bấm một nút là tạo được đơn ship, có mã vận đơn, rồi trạng thái tự cập nhật về web qua webhook. Với đơn giao nhanh nội thành thì có thể dùng Ahamove để khách xem shipper trên bản đồ.
3. Thanh toán online qua VNPay hoặc MoMo, và tự đối soát chuyển khoản qua Casso hoặc SePay.
4. Gửi email xác nhận và tin nhắn Zalo khi đặt đơn và khi đơn đổi trạng thái. Chỗ để gắn vào là cuối hai hàm `createOrder` và `updateOrderStatus` trong `services/order.service.ts`.
5. Cho khách đánh giá sau khi nhận hàng, lấy đánh giá thật thay cho phần đánh giá mẫu ở trang chủ.
6. Viết test E2E bằng Playwright và chạy tự động mỗi lần đẩy code.
7. Nếu sau này tách backend riêng (Spring Boot hoặc NestJS) thì chỉ cần sửa phần bên trong `services/*.service.ts` thành gọi API sang backend mới. Giao diện và thư mục `lib/` giữ nguyên.
