import "server-only";
import { Prisma } from "@prisma/client";
import { getDummyHash, hashPassword, verifyPassword } from "@/lib/password";
import { normalizeName, normalizePhone } from "@/lib/text";
import type { ChangePasswordValues, ProfileValues, RegisterValues } from "@/lib/validation";
import type { SessionUser } from "@/server/auth";
import { db } from "@/server/db";
import { OrderError } from "./order.service";

type UserRow = Prisma.UserGetPayload<object>;

const toSessionUser = ({ id, email, phone, fullName, role }: UserRow): SessionUser => ({
  id,
  email,
  phone,
  fullName,
  role: role === "admin" ? "admin" : "customer",
});

/** Lỗi trùng email/SĐT khi tạo hoặc sửa tài khoản → thông báo đúng ô bị trùng. */
function duplicateError(error: unknown): OrderError | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") return null;
  const target = JSON.stringify(error.meta?.target ?? "");
  if (target.includes("phone")) return new OrderError("phone_taken", "Số điện thoại này đã được dùng cho một tài khoản khác.", 409);
  return new OrderError("email_taken", "Email này đã được đăng ký. Bạn đăng nhập hoặc dùng email khác nhé.", 409);
}

export async function registerUser(input: RegisterValues): Promise<SessionUser> {
  try {
    const row = await db.user.create({
      data: {
        email: input.email.trim().toLowerCase(),
        phone: normalizePhone(input.phone),
        fullName: normalizeName(input.fullName),
        passwordHash: await hashPassword(input.password),
      },
    });
    return toSessionUser(row);
  } catch (error) {
    throw duplicateError(error) ?? error;
  }
}

/** Đăng nhập bằng email hoặc số điện thoại. Sai thông tin luôn trả cùng một thông báo. */
export async function authenticate(identifier: string, password: string): Promise<SessionUser | null> {
  const id = identifier.trim();
  const row = id.includes("@")
    ? await db.user.findUnique({ where: { email: id.toLowerCase() } })
    : await db.user.findUnique({ where: { phone: normalizePhone(id) } });
  if (!row) {
    await verifyPassword(password, await getDummyHash());
    return null;
  }
  return (await verifyPassword(password, row.passwordHash)) ? toSessionUser(row) : null;
}

export async function updateProfile(userId: string, input: ProfileValues): Promise<SessionUser> {
  try {
    const row = await db.user.update({
      where: { id: userId },
      data: { fullName: normalizeName(input.fullName), phone: normalizePhone(input.phone) },
    });
    return toSessionUser(row);
  } catch (error) {
    throw duplicateError(error) ?? error;
  }
}

export async function changePassword(userId: string, input: ChangePasswordValues): Promise<void> {
  const row = await db.user.findUnique({ where: { id: userId } });
  if (!row || !(await verifyPassword(input.currentPassword, row.passwordHash))) {
    throw new OrderError("wrong_password", "Mật khẩu hiện tại chưa đúng.", 400);
  }
  await db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(input.newPassword) } });
}

/** Lịch sử đơn của tài khoản, mới nhất trước. */
export async function listUserOrders(userId: string, take = 50) {
  return db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      code: true,
      createdAt: true,
      total: true,
      status: true,
      paymentStatus: true,
      recipientName: true,
      _count: { select: { items: true } },
    },
  });
}

export async function isOrderOwnedBy(code: string, userId: string): Promise<boolean> {
  return (await db.order.count({ where: { code, userId } })) > 0;
}
