import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [openOrders, todayOrders, lowStockProducts, recentOrders] = await Promise.all([
    prisma.order.count({ where: { status: "open" } }),
    prisma.order.findMany({
      where: { status: "closed", closedAt: { gte: today, lt: tomorrow } },
    }),
    prisma.product.findMany({
      where: { active: true, stock: { lte: prisma.product.fields.minStock } },
      include: { category: true },
    }),
    prisma.order.findMany({
      where: { status: "closed", closedAt: { gte: today, lt: tomorrow } },
      include: { table: true },
      orderBy: { closedAt: "desc" },
      take: 5,
    }),
  ]);

  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const todayCash = todayOrders.filter((o) => o.paymentMethod === "cash").reduce((s, o) => s + o.total, 0);
  const todayCard = todayOrders.filter((o) => o.paymentMethod === "card").reduce((s, o) => s + o.total, 0);

  const allLowStock = await prisma.product.findMany({
    where: { active: true },
    include: { category: true },
  });
  const lowStock = allLowStock.filter((p) => p.stock <= p.minStock);

  return NextResponse.json({
    openOrders,
    todayClosedOrders: todayOrders.length,
    todayRevenue,
    todayCash,
    todayCard,
    lowStockCount: lowStock.length,
    lowStockProducts: lowStock.slice(0, 5),
    recentOrders,
  });
}
