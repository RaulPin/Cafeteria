import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: orderId } = await params;
  const { productId, quantity, notes } = await req.json();

  if (!productId || !quantity) {
    return NextResponse.json({ error: "Producto y cantidad requeridos" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "open") {
    return NextResponse.json({ error: "Orden no válida o cerrada" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

  if (product.stock < quantity) {
    return NextResponse.json({ error: `Stock insuficiente. Disponible: ${product.stock} ${product.unit}` }, { status: 400 });
  }

  const [item] = await prisma.$transaction([
    prisma.orderItem.create({
      data: { orderId, productId, quantity: Number(quantity), price: product.price, notes },
      include: { product: { include: { category: true } } },
    }),
    prisma.product.update({
      where: { id: productId },
      data: { stock: { decrement: Number(quantity) } },
    }),
    prisma.inventoryMovement.create({
      data: { productId, type: "out", quantity: Number(quantity), reason: `Orden #${orderId.slice(-6)}` },
    }),
  ]);

  const allItems = await prisma.orderItem.findMany({ where: { orderId } });
  const total = allItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  await prisma.order.update({ where: { id: orderId }, data: { total, subtotal: total } });

  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: orderId } = await params;
  const { itemId } = await req.json();

  const item = await prisma.orderItem.findUnique({ where: { id: itemId } });
  if (!item) return NextResponse.json({ error: "Item no encontrado" }, { status: 404 });

  await prisma.$transaction([
    prisma.orderItem.delete({ where: { id: itemId } }),
    prisma.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    }),
    prisma.inventoryMovement.create({
      data: { productId: item.productId, type: "in", quantity: item.quantity, reason: "Cancelación de item" },
    }),
  ]);

  const allItems = await prisma.orderItem.findMany({ where: { orderId } });
  const total = allItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  await prisma.order.update({ where: { id: orderId }, data: { total, subtotal: total } });

  return NextResponse.json({ success: true });
}
