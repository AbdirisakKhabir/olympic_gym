import { prisma } from "@/app/lib/prisma";
import {
  PERMISSION_MEMBERS_OUTSTANDING_BALANCE,
  PERMISSION_PAYMENTS_CREATE,
  PERMISSION_PAYMENTS_VIEW,
} from "./permissionCodes";


export {
  PERMISSION_MEMBERS_OUTSTANDING_BALANCE,
  PERMISSION_PAYMENTS_CREATE,
  PERMISSION_PAYMENTS_VIEW,
};

export async function sessionMayRecordPayments(session: {
  user?: { id?: string; role?: string };
} | null): Promise<boolean> {
  if (!session?.user?.id) return false;
  if (session.user.role === "admin") return true;
  const uid = parseInt(session.user.id, 10);
  if (Number.isNaN(uid)) return false;
  const codes = await getPermissionCodesForUserId(uid);
  return userHasPermission(codes, PERMISSION_PAYMENTS_CREATE);
}

export async function sessionMayViewPayments(session: {
  user?: { id?: string; role?: string };
} | null): Promise<boolean> {
  if (!session?.user?.id) return false;
  if (session.user.role === "admin") return true;
  const uid = parseInt(session.user.id, 10);
  if (Number.isNaN(uid)) return false;
  const codes = await getPermissionCodesForUserId(uid);
  return (
    userHasPermission(codes, PERMISSION_PAYMENTS_VIEW) ||
    userHasPermission(codes, PERMISSION_PAYMENTS_CREATE)
  );
}

export async function getPermissionCodesForUserId(
  userId: number
): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return [];
  const role = await prisma.role.findFirst({
    where: { name: user.role },
    include: {
      permissions: { include: { permission: true } },
    },
  });
  return role?.permissions.map((rp) => rp.permission.code) ?? [];
}

export function userHasPermission(
  codes: string[],
  code: string
): boolean {
  return codes.includes(code);
}
