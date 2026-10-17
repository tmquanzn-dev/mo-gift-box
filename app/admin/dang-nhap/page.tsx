import { redirect } from "next/navigation";

/** Quản trị viên dùng chung trang đăng nhập với khách; giữ đường dẫn cũ cho khỏi gãy link. */
export default function AdminLoginPage() {
  redirect("/dang-nhap?next=/admin");
}
