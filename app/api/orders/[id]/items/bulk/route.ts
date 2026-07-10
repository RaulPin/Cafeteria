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
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new Error(`Producto no encontrado`);
        if (product.stock < item.quantity) {
          throw new Error(`Stock insuficiente para "${product.name}". Disponible: ${product.stock} ${product.unit}`);
        }

        await tx.orderItem.create({
          data: {
            orderId,
            productId: item.productId,
            quantity: item.quantity,
            price: product.price,
            notes: item.notes,
          },
        });
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            type: "out",
            quantity: item.quantity,
            reason: `Orden #${orderId.slice(-6)}`,
          },
        });
      }

      const allItems = await tx.orderItem.findMany({ where: { orderId } });
      const total = allItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      await tx.order.update({ where: { id: orderId }, data: { total, subtotal: total } });
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al agregar productos";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
