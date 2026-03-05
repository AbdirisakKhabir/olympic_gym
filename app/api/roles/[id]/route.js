import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const role = await prisma.role.findUnique({
      where: { id: parseInt(id) },
      include: {
        permissions: { include: { permission: true } },
      },
    });
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }
    return NextResponse.json(role);
  } catch (error) {
    console.error("Error fetching role:", error);
    return NextResponse.json(
      { error: "Failed to fetch role" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, permissionIds } = body;

    const roleId = parseInt(id);
    const existing = await prisma.role.findUnique({ where: { id: roleId } });
    if (!existing) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;

    const role = await prisma.role.update({
      where: { id: roleId },
      data: updateData,
    });

    if (permissionIds !== undefined && Array.isArray(permissionIds)) {
      await prisma.rolePermission.deleteMany({ where: { roleId } });
      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map((pid) => ({
            roleId,
            permissionId: Number(pid),
          })),
          skipDuplicates: true,
        });
      }
    }

    const updated = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: { include: { permission: true } },
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating role:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Role name already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const roleId = parseInt(id);
    await prisma.role.delete({ where: { id: roleId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting role:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete role" },
      { status: 500 }
    );
  }
}
