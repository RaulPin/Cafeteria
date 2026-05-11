"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, ShieldCheck, User, ToggleLeft, ToggleRight } from "lucide-react";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

const emptyForm = { name: "", email: "", password: "", role: "user" };

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<UserRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const isAdmin = (session?.user as { role?: string })?.role === "admin";

  useEffect(() => {
    if (status === "authenticated" && !isAdmin) router.replace("/dashboard");
  }, [status, isAdmin, router]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) setUsers(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isAdmin) fetchUsers(); }, [isAdmin, fetchUsers]);

  function openAdd() {
    setEditTarget(null);
    setForm(emptyForm);
    setFormError("");
    setDialog(true);
  }

  function openEdit(user: UserRecord) {
    setEditTarget(user);
    setForm({ name: user.name, email: user.email, password: "", role: user.role });
    setFormError("");
    setDialog(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const url = editTarget ? `/api/users/${editTarget.id}` : "/api/users";
      const method = editTarget ? "PUT" : "POST";
      const body = editTarget
        ? { name: form.name, email: form.email, role: form.role, ...(form.password ? { password: form.password } : {}) }
        : form;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      let data: { error?: string } = {};
      try { data = await res.json(); } catch { /* non-json */ }
      if (!res.ok) {
        setFormError(data.error ?? `Error (${res.status})`);
      } else {
        setDialog(false);
        fetchUsers();
      }
    } catch {
      setFormError("Error de red. Intenta de nuevo.");
    }
    setSaving(false);
  }

  async function handleToggleActive(user: UserRecord) {
    const currentUserId = (session?.user as { id?: string })?.id;
    if (user.id === currentUserId) return;
    await fetch(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !user.active }),
    });
    fetchUsers();
  }

  if (status === "loading" || loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Cargando...</div>;
  }

  if (!isAdmin) return null;

  const currentUserId = (session?.user as { id?: string })?.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500 text-sm mt-1">Gestión de accesos al sistema</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo usuario
        </Button>
      </div>

      <div className="space-y-3">
        {users.map((user) => {
          const isSelf = user.id === currentUserId;
          return (
            <Card key={user.id} className={!user.active ? "opacity-60" : ""}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-100">
                  {user.role === "admin"
                    ? <ShieldCheck className="h-5 w-5 text-amber-700" />
                    : <User className="h-5 w-5 text-gray-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{user.name}</p>
                    {isSelf && <span className="text-xs text-gray-400">(tú)</span>}
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {user.role === "admin" ? "Administrador" : "Barista"}
                    </Badge>
                    {!user.active && <Badge variant="destructive">Inactivo</Badge>}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => openEdit(user)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(user)}
                    disabled={isSelf}
                    className="text-gray-400 hover:text-gray-600 p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                    title={user.active ? "Desactivar" : "Activar"}
                  >
                    {user.active
                      ? <ToggleRight className="h-5 w-5 text-green-500" />
                      : <ToggleLeft className="h-5 w-5" />}
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={dialog} onOpenChange={(open) => { setDialog(open); if (!open) setFormError(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Ej. María García"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="correo@cafeteria.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {editTarget ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña"}
              </label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editTarget}
                placeholder={editTarget ? "••••••••" : "Mínimo 6 caracteres"}
                minLength={editTarget && !form.password ? undefined : 6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v })}
                disabled={editTarget?.id === currentUserId}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Barista — solo mesas y órdenes</SelectItem>
                  <SelectItem value="admin">Administrador — acceso completo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-3 py-2 text-sm">{formError}</div>
            )}
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setDialog(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? "Guardando..." : editTarget ? "Guardar cambios" : "Crear usuario"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
