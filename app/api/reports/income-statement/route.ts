import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { startDate, endDate } = await req.json();

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const [payments, expenses] = await Promise.all([
      prisma.payment.findMany({
        where: {
          date: {
            gte: start,
            lte: end,
          },
        },
        orderBy: { date: "desc" },
        include: {
          customer: { select: { name: true } },
        },
      }),
      prisma.expense.findMany({
        where: {
          date: {
            gte: start,
            lte: end,
          },
        },
        orderBy: { date: "desc" },
      }),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + p.paidAmount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netIncome = totalRevenue - totalExpenses;

    const expensesByType = expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + e.amount;
      return acc;
    }, {});

    return NextResponse.json({
      revenue: {
        total: totalRevenue,
        paymentCount: payments.length,
        payments,
      },
      expenses: {
        total: totalExpenses,
        expenseCount: expenses.length,
        byType: expensesByType,
        expenses,
      },
      netIncome,
      period: {
        startDate: start,
        endDate: end,
      },
    });
  } catch (error) {
    console.error("Error fetching income statement:", error);
    return NextResponse.json(
      {
        error:
          "Failed to fetch income statement" +
          (error instanceof Error ? `: ${error.message}` : ""),
      },
      { status: 500 }
    );
  }
}
