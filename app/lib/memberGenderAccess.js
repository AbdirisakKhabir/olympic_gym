import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const MEMBER_GENDER_ACCESS_VALUES = ["both", "male", "female"];

/** @param {string | null | undefined} value */
export function normalizeMemberGenderAccess(value) {
  const v = (value || "both").toLowerCase().trim();
  if (v === "male" || v === "female" || v === "both") return v;
  return "both";
}

/**
 * Merge Prisma where with gender scope (AND).
 * @param {object} where
 * @param {string | null | undefined} access
 */
export function applyMemberGenderAccessToWhere(where, access) {
  const a = normalizeMemberGenderAccess(access);
  if (a === "both") return where;
  const gender = a === "male" ? "male" : "female";
  const genderClause = { gender };
  const isEmpty =
    !where ||
    (typeof where === "object" && Object.keys(where).length === 0);
  if (isEmpty) return genderClause;
  return { AND: [where, genderClause] };
}

/**
 * @param {string | null | undefined} access
 * @param {string | null | undefined} customerGender
 */
export function customerGenderMatchesAccess(access, customerGender) {
  const a = normalizeMemberGenderAccess(access);
  if (a === "both") return true;
  const g = (customerGender || "").toLowerCase();
  if (a === "male") return g === "male";
  if (a === "female") return g === "female";
  return true;
}

/**
 * Load memberGenderAccess from DB for the current session user.
 * @returns {Promise<{ access: string, userId: number } | null>}
 */
export async function getMemberGenderAccessForSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const userId = parseInt(session.user.id, 10);
  if (Number.isNaN(userId)) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { memberGenderAccess: true },
  });
  if (!user) return null;
  return {
    userId,
    access: normalizeMemberGenderAccess(user.memberGenderAccess),
  };
}
