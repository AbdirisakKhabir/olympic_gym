import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const permission = await prisma.permission.findUnique({
      where: { id: parseInt(id) },
    });
    if (!permission) {
      return NextResponse.json({ error: "Permission not found" }, { status: 404 });
    }
    return NextResponse.json(permission);
  } catch (error) {
    console.error("Error fetching permission:", error);
    return NextResponse.json(
      { error: "Failed to fetch permission" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { code, name, description } = body;

    const permId = parseInt(id);
    const existing = await prisma.permission.findUnique({ where: { id: permId } });
    if (!existing) {
      return NextResponse.json({ error: "Permission not found" }, { status: 404 });
    }

    const updateData = {};
    if (code !== undefined) updateData.code = code.trim();
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;

    const permission = await prisma.permission.update({
      where: { id: permId },
      data: updateData,
    });
    return NextResponse.json(permission);
  } catch (error) {
    console.error("Error updating permission:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Permission code already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update permission" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const permId = parseInt(id);
    await prisma.permission.delete({ where: { id: permId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting permission:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Permission not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete permission" },
      { status: 500 }
    );
  }
}
