import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { paymentMethod } = await req.json();

  if (!paymentMethod || !["cash", "card"].includes(paymentMethod)) {
    return NextResponse.json({ error: "Método de pago inválido" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order || order.status !== "open") {
    return NextResponse.json({ error: "Orden no válida o ya cerrada" }, { status: 400 });
  }

  if (order.items.length === 0) {
    return NextResponse.json({ error: "La orden no tiene productos" }, { status: 400 });
  }

  const total = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const closedOrder = await prisma.order.update({
    where: { id },
    data: {
      status: "closed",
      paymentMethod,
      total,
      subtotal: total,
      closedAt: new Date(),
    },
    include: {
      table: true,
      items: { include: { product: { include: { category: true } } } },
    },
  });

  return NextResponse.json(closedOrder);
}
