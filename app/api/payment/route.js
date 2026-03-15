import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const {
      customerId,
      userId,
      paidAmount,
      discount = 0,
      amountDue,
      date,
    } = body;

    if (!customerId || !userId || paidAmount === undefined) {
      return NextResponse.json(
        { error: "Customer ID, User ID, and paid amount are required" },
        { status: 400 }
      );
    }

    const custId = parseInt(customerId);
    const uid = parseInt(userId);
    const paid = parseFloat(paidAmount);
    const disc = parseFloat(discount) || 0;

    const customer = await prisma.customer.findUnique({
      where: { id: custId },
    });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const due = amountDue !== undefined && amountDue !== null && amountDue !== ""
      ? parseFloat(amountDue)
      : (customer.balance ?? 0);
    const newBalance = Math.max(0, due - paid - disc);
    const paymentDate = date ? new Date(date) : new Date();

    const [, newPayment] = await prisma.$transaction([
      prisma.customer.update({
        where: { id: custId },
        data: { balance: newBalance, updatedAt: new Date() },
      }),
      prisma.payment.create({
        data: {
          customerId: custId,
          userId: uid,
          paidAmount: paid,
          discount: disc,
          balance: newBalance,
          date: paymentDate,
        },
        include: {
          customer: { select: { name: true, phone: true } },
          user: { select: { username: true } },
        },
      }),
    ]);

    const updatedCustomer = await prisma.customer.findUnique({
      where: { id: custId },
    });

    return NextResponse.json(
      { payment: newPayment, customer: updatedCustomer },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating payment:", error);

    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Customer or user not found" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const payments = await prisma.payment.findMany({
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
