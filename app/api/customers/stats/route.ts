// /api/customers/stats/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999);

    const [total, active, noExpireDate, expired, expiring] = await Promise.all([
      // Total members
      prisma.customer.count(),
      
      // Active members (isActive = true AND expireDate >= today)
      prisma.customer.count({
        where: {
          isActive: true,
          expireDate: { gte: today }
        }
      }),
      
      // No expire date members (expireDate is null)
      prisma.customer.count({
        where: {
          expireDate: null
        }
      }),
      
      // Expired members (expireDate < today OR isActive = false)
      prisma.customer.count({
        where: {
          OR: [
            { expireDate: { lt: today } },
            { isActive: false }
          ]
        }
      }),
      
      // Expiring soon (expireDate between today and next week)
      prisma.customer.count({
        where: {
          expireDate: {
            gte: today,
            lte: nextWeek
          }
        }
      })
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