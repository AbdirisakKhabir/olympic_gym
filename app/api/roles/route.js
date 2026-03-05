import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, description, permissionIds } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Role name is required" },
        { status: 400 }
      );
    }

    const role = await prisma.role.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    if (permissionIds && Array.isArray(permissionIds) && permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((pid) => ({
          roleId: role.id,
          permissionId: Number(pid),
        })),
        skipDuplicates: true,
      });
    }

    const created = await prisma.role.findUnique({
      where: { id: role.id },
      include: {
        permissions: { include: { permission: true } },
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating role:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Role name already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create role" },
      { status: 500 }
    );
  }
}
