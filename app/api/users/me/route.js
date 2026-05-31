import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { PrismaClient } from "@prisma/client";
import { normalizeMemberGenderAccess } from "@/app/lib/memberGenderAccess";
import { getPermissionCodesForUserId } from "@/app/lib/userPermissions";

const prisma = new PrismaClient();

/** Current user profile fields needed by the client (member list UI, etc.) */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = parseInt(session.user.id, 10);
  if (Number.isNaN(userId)) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
        memberGenderAccess: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const permissionCodes = await getPermissionCodesForUserId(userId);
    return NextResponse.json({
      ...user,
      memberGenderAccess: normalizeMemberGenderAccess(user.memberGenderAccess),
      permissionCodes,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load user" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
