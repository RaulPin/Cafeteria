import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

async function getAdminSession() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  return user?.role === "admin" ? user : null;
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const currentUserId = admin.id;

  try {
    const { name, email, password, role, active } = await req.json();

    // Prevent admin from removing their own admin role or deactivating themselves
    if (id === currentUserId && (role === "user" || active === false)) {
      return NextResponse.json({ error: "No puedes modificar tu propio rol o estado" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (role !== undefined) data.role = role;
    if (active !== undefined) data.active = active;
    if (password) data.password = await bcrypt.hash(password, 12);

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });
    return NextResponse.json(user);
  } catch (e) {
    console.error("PUT /api/users/[id] error:", e);
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 });
  }
}
