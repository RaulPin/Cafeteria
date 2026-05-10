import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  try {
    let where = undefined;
    if (date) {
      const [y, m, d] = date.split("-").map(Number);
      where = {
        date: {
          gte: new Date(y, m - 1, d, 0, 0, 0, 0),
          lte: new Date(y, m - 1, d, 23, 59, 59, 999),
        },
      };
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
    });
    return NextResponse.json(expenses);
  } catch (e) {
    console.error("GET /api/expenses error:", e);
    return NextResponse.json({ error: "Error al obtener gastos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { description, amount, category, paymentMethod, date } = await req.json();
    if (!description || !amount) {
      return NextResponse.json({ error: "Descripción y monto son requeridos" }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        description,
        amount: Number(amount),
        category: category ?? "Otros",
        paymentMethod: paymentMethod ?? "cash",
        date: date ? new Date(date) : new Date(),
      },
    });
    return NextResponse.json(expense, { status: 201 });
  } catch (e) {
    console.error("POST /api/expenses error:", e);
    return NextResponse.json({ error: "Error al crear el gasto" }, { status: 500 });
  }
}
