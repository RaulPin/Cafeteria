import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      table: true,
      items: { include: { product: { include: { category: true } } } },
    },
  });
  if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  return NextResponse.json(order);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      // Restore stock for closed orders
      if (order.status === "closed") {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
          await tx.inventoryMovement.create({
            data: { productId: item.productId, type: "in", quantity: item.quantity, reason: "Orden eliminada" },
          });
        }
      }
      await tx.inventoryMovement.deleteMany({ where: { reason: { contains: order.id.slice(-6) } } });
      await tx.orderItem.deleteMany({ where: { orderId: id } });
      await tx.order.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/orders/[id] error:", e);
    return NextResponse.json({ error: "Error al eliminar la orden" }, { status: 500 });
  }
}
