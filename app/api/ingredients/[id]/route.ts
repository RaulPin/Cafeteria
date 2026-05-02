import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { name, category, minStock, unit, active } = await req.json();

  const ingredient = await prisma.ingredient.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(category !== undefined && { category }),
      ...(minStock !== undefined && { minStock: Number(minStock) }),
      ...(unit !== undefined && { unit }),
      ...(active !== undefined && { active }),
    },
  });
  return NextResponse.json(ingredient);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  await prisma.ingredient.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ success: true });
}
