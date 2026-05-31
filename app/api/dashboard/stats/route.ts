import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { PrismaClient } from "@prisma/client";
import {
  applyMemberGenderAccessToWhere,
  getMemberGenderAccessForSessionUser,
} from "@/app/lib/memberGenderAccess";

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "admin";

  try {
    const scope = await getMemberGenderAccessForSessionUser();
    if (!scope) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999);

    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    lastOfMonth.setHours(23, 59, 59, 999);

    const [
      totalMembers,
      activeMembers,
      expiredMembers,
      expiringSoon,
      noExpireDate,
      monthlyPayments,
      monthlyExpenses,
      totalBalances,
    ] = await Promise.all([
      prisma.customer.count({
        where: applyMemberGenderAccessToWhere({}, scope.access),
      }),
      prisma.customer.count({
        where: applyMemberGenderAccessToWhere(
          {
            isActive: true,
            expireDate: { gte: today },
          },
          scope.access
        ),
      }),
      prisma.customer.count({
        where: applyMemberGenderAccessToWhere(
          {
            OR: [{ expireDate: { lt: today } }, { isActive: false }],
          },
          scope.access
        ),
      }),
      prisma.customer.count({
        where: applyMemberGenderAccessToWhere(
          {
            expireDate: { gte: today, lte: nextWeek },
          },
          scope.access
        ),
      }),
      prisma.customer.count({
        where: applyMemberGenderAccessToWhere(
          { expireDate: null },
          scope.access
        ),
      }),
      isAdmin
        ? prisma.payment.aggregate({
            where: {
              date: { gte: firstOfMonth, lte: lastOfMonth },
            },
            _sum: { paidAmount: true },
          })
        : Promise.resolve({ _sum: { paidAmount: null as number | null } }),
      isAdmin
        ? prisma.expense.aggregate({
            where: {
              date: { gte: firstOfMonth, lte: lastOfMonth },
            },
            _sum: { amount: true },
          })
        : Promise.resolve({ _sum: { amount: null as number | null } }),
      isAdmin
        ? prisma.customer.aggregate({
            where: applyMemberGenderAccessToWhere({}, scope.access),
            _sum: { balance: true },
          })
        : Promise.resolve({ _sum: { balance: null as number | null } }),
    ]);

    const revenue = isAdmin ? (monthlyPayments._sum.paidAmount ?? 0) : 0;
    const expenses = isAdmin ? (monthlyExpenses._sum.amount ?? 0) : 0;
    const netIncome = isAdmin ? revenue - expenses : 0;
    const totalBalancesAmount = isAdmin ? (totalBalances._sum.balance ?? 0) : 0;

    return NextResponse.json({
      members: {
        total: totalMembers,
        active: activeMembers,
        expired: expiredMembers,
        expiringSoon,
        noExpireDate,
      },
      financials: {
        revenue,
        expenses,
        netIncome,
        totalBalances: totalBalancesAmount,
      },
      period: {
        month: today.toLocaleString("default", { month: "long" }),
        year: today.getFullYear(),
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
