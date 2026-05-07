import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(categories);
  } catch (e) {
    console.error("GET /api/categories error:", e);
    return NextResponse.json({ error: "Error al obtener categorías" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { name, color } = await req.json();
  if (!name) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

  const category = await prisma.category.create({ data: { name, color } });
  return NextResponse.json(category, { status: 201 });
}
