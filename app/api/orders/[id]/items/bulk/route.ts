import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: orderId } = await params;
  const { items } = await req.json() as { items: { productId: string; quantity: number; notes?: string }[] };

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Sin productos" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "open") {
    return NextResponse.json({ error: "Orden no válida o cerrada" }, { status: 400 });
  }

  try {
    const ops: Parameters<typeof prisma.$transaction>[0] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) return NextResponse.json({ error: `Producto no encontrado` }, { status: 404 });
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para "${product.name}". Disponible: ${product.stock} ${product.unit}` },
          { status: 400 }
        );
      }

      ops.push(
        prisma.orderItem.create({
          data: { orderId, productId: item.productId, quantity: item.quantity, price: product.price, notes: item.notes },
        }),
        prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        }),
        prisma.inventoryMovement.create({
          data: { productId: item.productId, type: "out", quantity: item.quantity, reason: `Orden #${orderId.slice(-6)}` },
        })
      );
    }

    await prisma.$transaction(ops);

    const allItems = await prisma.orderItem.findMany({ where: { orderId } });
    const total = allItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    await prisma.order.update({ where: { id: orderId }, data: { total, subtotal: total } });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e) {
    console.error("POST /items/bulk error:", e);
    return NextResponse.json({ error: "Error al agregar productos" }, { status: 500 });
  }
}
