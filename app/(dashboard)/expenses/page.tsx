"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { Plus, Pencil, Trash2, TrendingDown, Banknote, CreditCard } from "lucide-react";

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  paymentMethod: string;
  date: string;
}

const CATEGORIES = ["Insumos", "Renta", "Servicios", "Nómina", "Mantenimiento", "Marketing", "Otros"];

const CATEGORY_COLORS: Record<string, string> = {
  Insumos: "bg-orange-100 text-orange-800",
  Renta: "bg-blue-100 text-blue-800",
  Servicios: "bg-cyan-100 text-cyan-800",
  Nómina: "bg-purple-100 text-purple-800",
  Mantenimiento: "bg-yellow-100 text-yellow-800",
  Marketing: "bg-pink-100 text-pink-800",
  Otros: "bg-gray-100 text-gray-800",
};

const today = () => new Date().toISOString().split("T")[0];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(today());
  const [filterCategory, setFilterCategory] = useState("all");

  const [dialog, setDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [form, setForm] = useState({ description: "", amount: "", category: "Insumos", paymentMethod: "cash", date: today() });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/expenses?date=${filterDate}`);
      if (res.ok) setExpenses(await res.json());
    } catch (e) {
      console.error("Error cargando gastos:", e);
    } finally {
      setLoading(false);
    }
  }, [filterDate]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  function openAdd() {
    setEditTarget(null);
    setForm({ description: "", amount: "", category: "Insumos", paymentMethod: "cash", date: filterDate });
    setFormError("");
    setDialog(true);
  }

  function openEdit(expense: Expense) {
    setEditTarget(expense);
    setForm({
      description: expense.description,
      amount: String(expense.amount),
      category: expense.category,
      paymentMethod: expense.paymentMethod,
      date: expense.date.split("T")[0],
    });
    setFormError("");
    setDialog(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const url = editTarget ? `/api/expenses/${editTarget.id}` : "/api/expenses";
      const method = editTarget ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      let data: { error?: string } = {};
      try { data = await res.json(); } catch { /* non-json */ }
      if (!res.ok) {
        setFormError(data.error ?? `Error (${res.status})`);
      } else {
        setDialog(false);
        fetchExpenses();
      }
    } catch {
      setFormError("Error de red. Intenta de nuevo.");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este gasto?")) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    fetchExpenses();
  }

  const filtered = filterCategory === "all"
    ? expenses
    : expenses.filter((e) => e.category === filterCategory);

  const totalDay = expenses.reduce((s, e) => s + e.amount, 0);
  const totalCash = expenses.filter((e) => e.paymentMethod === "cash").reduce((s, e) => s + e.amount, 0);
  const totalCard = expenses.filter((e) => e.paymentMethod === "card").reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registro de Gastos</h1>
          <p className="text-gray-500 text-sm mt-1">Egresos diarios del negocio</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo gasto
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <Input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-44"
        />
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total egresos</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totalDay)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Banknote className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">En efectivo</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(totalCash)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Con tarjeta</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(totalCard)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses list */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <TrendingDown className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">Sin gastos registrados</p>
          <p className="text-sm mt-1">
            {filterDate === today() ? "Registra los egresos del día" : "No hay gastos para esta fecha"}
          </p>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{filtered.length} gasto(s)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {filtered.map((expense) => (
                <div key={expense.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{expense.description}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[expense.category] ?? "bg-gray-100 text-gray-800"}`}>
                        {expense.category}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {expense.paymentMethod === "cash" ? "Efectivo" : "Tarjeta"}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(expense.date).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  <p className="font-bold text-red-600 whitespace-nowrap">{formatCurrency(expense.amount)}</p>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(expense)} className="text-gray-400 hover:text-gray-600 p-1">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(expense.id)} className="text-gray-400 hover:text-red-600 p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialog} onOpenChange={(open) => { setDialog(open); if (!open) setFormError(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? "Editar gasto" : "Nuevo gasto"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                placeholder="Ej. Compra de leche entera"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto ($)</label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Método de pago</label>
                <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="card">Tarjeta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
            </div>
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-3 py-2 text-sm">{formError}</div>
            )}
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setDialog(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? "Guardando..." : editTarget ? "Guardar cambios" : "Registrar gasto"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
