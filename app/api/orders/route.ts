import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const date = searchParams.get("date");

  let dateFilter = {};
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    dateFilter = { createdAt: { gte: start, lte: end } };
  }

  const orders = await prisma.order.findMany({
    where: {
      ...(status ? { status } : {}),
      ...dateFilter,
    },
    include: {
      table: true,
      items: { include: { product: { include: { category: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { tableId, notes } = await req.json();
  if (!tableId) return NextResponse.json({ error: "Mesa requerida" }, { status: 400 });

  const existingOpen = await prisma.order.findFirst({
    where: { tableId, status: "open" },
  });
  if (existingOpen) {
    return NextResponse.json({ error: "Esta mesa ya tiene una cuenta abierta" }, { status: 400 });
  }

  const order = await prisma.order.create({
    data: { tableId, notes },
    include: { table: true, items: { include: { product: true } } },
  });
  return NextResponse.json(order, { status: 201 });
}
