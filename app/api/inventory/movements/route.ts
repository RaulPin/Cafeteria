import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const movements = await prisma.inventoryMovement.findMany({
    include: { product: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(movements);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { productId, type, quantity, reason } = await req.json();

  if (!productId || !type || !quantity) {
    return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

  if (type === "out" && product.stock < Number(quantity)) {
    return NextResponse.json({ error: "Stock insuficiente" }, { status: 400 });
  }

  const [movement] = await prisma.$transaction([
    prisma.inventoryMovement.create({
      data: { productId, type, quantity: Number(quantity), reason },
      include: { product: true },
    }),
    prisma.product.update({
      where: { id: productId },
      data: {
        stock: type === "in" ? { increment: Number(quantity) } : { decrement: Number(quantity) },
      },
    }),
  ]);

  return NextResponse.json(movement, { status: 201 });
}
