import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const tables = await prisma.table.findMany({
    where: { active: true },
    include: {
      orders: {
        where: { status: "open" },
        include: { items: { include: { product: true } } },
      },
    },
    orderBy: { number: "asc" },
  });
  return NextResponse.json(tables);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { number, type } = await req.json();
  if (!number) return NextResponse.json({ error: "Número de mesa requerido" }, { status: 400 });

  const table = await prisma.table.create({
    data: { number: Number(number), type: type ?? "physical" },
  });
  return NextResponse.json(table, { status: 201 });
}
