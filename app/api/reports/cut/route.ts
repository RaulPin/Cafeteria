import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ExcelJS from "exceljs";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];
  const format = searchParams.get("format") ?? "json";

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: { status: "closed", closedAt: { gte: start, lte: end } },
    include: { table: true, items: { include: { product: { include: { category: true } } } } },
  });

  const totalCash = orders.filter((o) => o.paymentMethod === "cash").reduce((s, o) => s + o.total, 0);
  const totalCard = orders.filter((o) => o.paymentMethod === "card").reduce((s, o) => s + o.total, 0);
  const totalRevenue = totalCash + totalCard;

  const categoryMap: Record<string, { name: string; total: number; qty: number }> = {};
  for (const order of orders) {
    for (const item of order.items) {
      const cat = item.product.category.name;
      if (!categoryMap[cat]) categoryMap[cat] = { name: cat, total: 0, qty: 0 };
      categoryMap[cat].total += item.price * item.quantity;
      categoryMap[cat].qty += item.quantity;
    }
  }
  const categoryBreakdown = Object.values(categoryMap).sort((a, b) => b.total - a.total);

  if (format === "excel") {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Cafetería Sistema";

    const summarySheet = workbook.addWorksheet("Resumen");
    summarySheet.columns = [
      { header: "Concepto", key: "concept", width: 30 },
      { header: "Valor", key: "value", width: 20 },
    ];

    const headerRow = summarySheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF78350F" } };

    summarySheet.addRow({ concept: "Fecha", value: new Date(date).toLocaleDateString("es-MX") });
    summarySheet.addRow({ concept: "Total de órdenes cerradas", value: orders.length });
    summarySheet.addRow({ concept: "Total en efectivo", value: totalCash });
    summarySheet.addRow({ concept: "Total con tarjeta", value: totalCard });
    summarySheet.addRow({ concept: "TOTAL DEL DÍA", value: totalRevenue });

    summarySheet.getRow(6).font = { bold: true };

    const catSheet = workbook.addWorksheet("Por Categoría");
    catSheet.columns = [
      { header: "Categoría", key: "name", width: 25 },
      { header: "Cantidad vendida", key: "qty", width: 20 },
      { header: "Total ($)", key: "total", width: 20 },
    ];
    const catHeader = catSheet.getRow(1);
    catHeader.font = { bold: true, color: { argb: "FFFFFFFF" } };
    catHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF78350F" } };

    for (const cat of categoryBreakdown) {
      catSheet.addRow({ name: cat.name, qty: cat.qty, total: cat.total });
    }

    const detailSheet = workbook.addWorksheet("Detalle de Órdenes");
    detailSheet.columns = [
      { header: "Orden ID", key: "id", width: 20 },
      { header: "Mesa", key: "table", width: 15 },
      { header: "Hora cierre", key: "closedAt", width: 20 },
      { header: "Método pago", key: "payment", width: 18 },
      { header: "Total ($)", key: "total", width: 15 },
    ];
    const detailHeader = detailSheet.getRow(1);
    detailHeader.font = { bold: true, color: { argb: "FFFFFFFF" } };
    detailHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF78350F" } };

    for (const order of orders) {
      detailSheet.addRow({
        id: order.id.slice(-8).toUpperCase(),
        table: order.table.type === "takeout" ? "Para llevar" : `Mesa ${order.table.number}`,
        closedAt: order.closedAt ? new Date(order.closedAt).toLocaleTimeString("es-MX") : "-",
        payment: order.paymentMethod === "cash" ? "Efectivo" : "Tarjeta",
        total: order.total,
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="corte-caja-${date}.xlsx"`,
      },
    });
  }

  return NextResponse.json({ date, totalOrders: orders.length, totalCash, totalCard, totalRevenue, categoryBreakdown, orders });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { date } = await req.json();
  const targetDate = date ?? new Date().toISOString().split("T")[0];

  const start = new Date(targetDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(targetDate);
  end.setHours(23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: { status: "closed", closedAt: { gte: start, lte: end } },
    include: { items: { include: { product: { include: { category: true } } } } },
  });

  const totalCash = orders.filter((o) => o.paymentMethod === "cash").reduce((s, o) => s + o.total, 0);
  const totalCard = orders.filter((o) => o.paymentMethod === "card").reduce((s, o) => s + o.total, 0);

  const categoryMap: Record<string, { name: string; total: number; qty: number }> = {};
  for (const order of orders) {
    for (const item of order.items) {
      const cat = item.product.category.name;
      if (!categoryMap[cat]) categoryMap[cat] = { name: cat, total: 0, qty: 0 };
      categoryMap[cat].total += item.price * item.quantity;
      categoryMap[cat].qty += item.quantity;
    }
  }

  const cut = await prisma.cashRegisterCut.create({
    data: {
      date: start,
      totalOrders: orders.length,
      totalCash,
      totalCard,
      totalRevenue: totalCash + totalCard,
      categoryBreakdown: JSON.stringify(Object.values(categoryMap)),
    },
  });

  return NextResponse.json(cut, { status: 201 });
}
