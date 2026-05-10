import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  try {
    const { description, amount, category, paymentMethod, date } = await req.json();
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...(description !== undefined && { description }),
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(category !== undefined && { category }),
        ...(paymentMethod !== undefined && { paymentMethod }),
        ...(date !== undefined && { date: new Date(date) }),
      },
    });
    return NextResponse.json(expense);
  } catch (e) {
    console.error("PUT /api/expenses/[id] error:", e);
    return NextResponse.json({ error: "Error al actualizar el gasto" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  try {
    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/expenses/[id] error:", e);
    return NextResponse.json({ error: "Error al eliminar el gasto" }, { status: 500 });
  }
}
