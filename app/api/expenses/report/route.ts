import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { startDate, endDate, type } = await req.json();

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const where: { date?: { gte: Date; lte: Date }; type?: string } = {
      date: {
        gte: start,
        lte: end,
      },
    };

    if (type) {
      where.type = type;
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: {
        date: "desc",
      },
    });

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    const byType = expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + e.amount;
      return acc;
    }, {});

    return NextResponse.json({
      expenses,
      totals: {
        totalAmount,
        totalExpenses: expenses.length,
        byType,
      },
      period: {
        startDate: start,
        endDate: end,
      },
    });
  } catch (error) {
    console.error("Error fetching expenses report:", error);
    return NextResponse.json(
      {
        error:
          "Failed to fetch expenses report" +
          (error instanceof Error ? `: ${error.message}` : ""),
      },
      { status: 500 }
    );
  }
}
