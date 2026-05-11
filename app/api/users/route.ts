import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

function isAdmin(session: Awaited<ReturnType<typeof getServerSession>>) {
  return (session?.user as { role?: string })?.role === "admin";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { name, email, password, role } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nombre, email y contraseña son requeridos" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role ?? "user" },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    console.error("POST /api/users error:", e);
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
  }
}
