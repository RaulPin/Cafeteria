import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const ingredients = await prisma.ingredient.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const lowStock = ingredients.filter((i) => i.stock <= i.minStock);
  return NextResponse.json({ ingredients, lowStock });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { name, category, stock, minStock, unit } = await req.json();
    if (!name) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        category: category ?? "Otros",
        stock: Number(stock ?? 0),
        minStock: Number(minStock ?? 1),
        unit: unit ?? "litro",
      },
    });

    if (Number(stock) > 0) {
      await prisma.ingredientMovement.create({
        data: { ingredientId: ingredient.id, type: "in", quantity: Number(stock), reason: "Stock inicial" },
      });
    }

    return NextResponse.json(ingredient, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    if (msg.includes("Unique constraint") || msg.includes("unique constraint")) {
      return NextResponse.json({ error: "Ya existe un insumo con ese nombre" }, { status: 409 });
    }
    console.error("POST /api/ingredients error:", msg);
    return NextResponse.json({ error: "Error al crear el insumo" }, { status: 500 });
  }
}
