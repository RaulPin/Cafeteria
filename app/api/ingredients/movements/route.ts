import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const movements = await prisma.ingredientMovement.findMany({
    include: { ingredient: true },
    orderBy: { createdAt: "desc" },
    take: 150,
  });
  return NextResponse.json(movements);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { ingredientId, type, quantity, reason } = await req.json();
  if (!ingredientId || !type || !quantity) {
    return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
  }

  const ingredient = await prisma.ingredient.findUnique({ where: { id: ingredientId } });
  if (!ingredient) return NextResponse.json({ error: "Insumo no encontrado" }, { status: 404 });

  if (type === "out" && ingredient.stock < Number(quantity)) {
    return NextResponse.json({ error: `Stock insuficiente. Disponible: ${ingredient.stock} ${ingredient.unit}` }, { status: 400 });
  }

  const [movement] = await prisma.$transaction([
    prisma.ingredientMovement.create({
      data: { ingredientId, type, quantity: Number(quantity), reason },
      include: { ingredient: true },
    }),
    prisma.ingredient.update({
      where: { id: ingredientId },
      data: {
        stock: type === "in"
          ? { increment: Number(quantity) }
          : { decrement: Number(quantity) },
      },
    }),
  ]);

  return NextResponse.json(movement, { status: 201 });
}
