import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { code: "asc" },
    });
    return NextResponse.json(permissions);
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { code, name, description } = body;

    if (!code?.trim() || !name?.trim()) {
      return NextResponse.json(
        { error: "Code and name are required" },
        { status: 400 }
      );
    }

    const permission = await prisma.permission.create({
      data: {
        code: code.trim(),
        name: name.trim(),
        description: description?.trim() || null,
      },
    });
    return NextResponse.json(permission, { status: 201 });
  } catch (error) {
    console.error("Error creating permission:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Permission code already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create permission" },
      { status: 500 }
    );
  }
}
