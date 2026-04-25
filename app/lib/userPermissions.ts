import { PrismaClient } from "@prisma/client";
import { PERMISSION_MEMBERS_OUTSTANDING_BALANCE } from "./permissionCodes";

const prisma = new PrismaClient();

export { PERMISSION_MEMBERS_OUTSTANDING_BALANCE };

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
