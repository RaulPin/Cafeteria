import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const activeOnly = searchParams.get("active") === "true";

  const products = await prisma.product.findMany({
    where: activeOnly ? { active: true } : undefined,
    include: { category: true },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { name, price, categoryId, stock, minStock, unit } = await req.json();
  if (!name || !price || !categoryId) {
    return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: { name, price: Number(price), categoryId, stock: Number(stock ?? 0), minStock: Number(minStock ?? 5), unit: unit ?? "unidad" },
    include: { category: true },
  });

  if (Number(stock) > 0) {
    await prisma.inventoryMovement.create({
      data: { productId: product.id, type: "in", quantity: Number(stock), reason: "Stock inicial" },
    });
  }

  return NextResponse.json(product, { status: 201 });
}
