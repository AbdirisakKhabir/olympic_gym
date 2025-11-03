// app/api/customers/route.js
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const gender = searchParams.get("gender");
    const type = searchParams.get("type"); // Add this for stats filtering
    const expireDate = searchParams.get("expireDate"); // For specific date filtering
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    let where = {};

    // Handle stats type filtering (priority over regular filters)
    if (type) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      nextWeek.setHours(23, 59, 59, 999);

      switch (type) {
        case "active":
          where = {
            isActive: true,
            expireDate: { gte: today },
          };
          break;
        case "expired":
          where = {
            OR: [
              { isActive: false },
              { expireDate: { lt: today } },
              { expireDate: null }, // Include customers with no expiration date
            ],
          };
          break;
        case "expiring":
          where = {
            isActive: true,
            expireDate: {
              gte: today,
              lte: nextWeek,
            },
          };
          break;
        default:
          // If unknown type, return all
          break;
      }
    } else {
      // Regular filtering (when no type parameter)
      if (search) {
        where.OR = [
          {
            name: {
              contains: search,
            },
          },
          {
            phone: {
              contains: search,
            },
          },
        ];
      }

      if (status && status !== "all") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (status) {
          case "active":
            where.isActive = true;
            where.expireDate = { gte: today };
            break;
          case "expired":
            where.OR = [
              { isActive: false },
              { expireDate: { lt: today } },
              { expireDate: null }, // Include customers with no expiration date
            ];
            break;
          case "expiring":
            const nextWeek = new Date();
            nextWeek.setDate(today.getDate() + 7);
            nextWeek.setHours(23, 59, 59, 999);

            where.isActive = true;
            where.expireDate = {
              gte: today,
              lte: nextWeek,
            };
            break;
          default:
            break;
        }
      }

      // Add gender filter
      if (gender && gender !== "all") {
        where.gender = gender;
      }

      // Handle specific expire date filter (for today, tomorrow filters)
      if (expireDate) {
        where.expireDate = expireDate;
      }
    }

    // Get customers with pagination
    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where,
        select: {
          id: true,
          name: true,
          phone: true,
          image: true,
          registerDate: true,
          expireDate: true,
          fee: true,
          isActive: true,
          gender: true,
          balance: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              payments: true,
            },
          },
        },
        orderBy: { registerDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json({
      customers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch customers",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
