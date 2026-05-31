// /api/customers/stats/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from "@prisma/client";
import {
  applyMemberGenderAccessToWhere,
  getMemberGenderAccessForSessionUser,
} from "@/app/lib/memberGenderAccess";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const scope = await getMemberGenderAccessForSessionUser();
    if (!scope) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999);

    const [total, active, noExpireDate, expired, expiring] = await Promise.all([
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
          { expireDate: null },
          scope.access
        ),
      }),
      prisma.customer.count({
        where: applyMemberGenderAccessToWhere(
          {
            OR: [
              { expireDate: { lt: today } },
              { isActive: false },
            ],
          },
          scope.access
        ),
      }),
      prisma.customer.count({
        where: applyMemberGenderAccessToWhere(
          {
            expireDate: {
              gte: today,
              lte: nextWeek,
            },
          },
          scope.access
        ),
      }),
    ]);

    return NextResponse.json({
      active,
      noExpireDate,
      expired,
      expiringThisWeek: expiring,
      total
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch stats',
  
    }, { status: 500 });
  }
}