"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Plus, Pencil, TrendingUp, TrendingDown, Package, Search } from "lucide-react";

interface Ingredient {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  active: boolean;
}

interface Movement {
  id: string;
  type: string;
  quantity: number;
  reason?: string;
  createdAt: string;
  ingredient: { name: string; unit: string; category: string };
}

const CATEGORIES = ["Lácteos", "Café", "Jarabes", "Frutas", "Panadería", "Bebidas base", "Otros"];
const UNITS = ["litro", "ml", "kg", "g", "pieza", "botella", "bolsa", "caja", "lata"];

const CATEGORY_COLORS: Record<string, string> = {
  "Lácteos": "bg-blue-100 text-blue-800",
  "Café": "bg-amber-100 text-amber-800",
  "Jarabes": "bg-purple-100 text-purple-800",
  "Frutas": "bg-green-100 text-green-800",
  "Panadería": "bg-orange-100 text-orange-800",
  "Bebidas base": "bg-cyan-100 text-cyan-800",
  "Otros": "bg-gray-100 text-gray-800",
};

export default function InventoryPage() {
  const [data, setData] = useState<{ ingredients: Ingredient[]; lowStock: Ingredient[] } | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"stock" | "movements">("stock");
  const [filterCategory, setFilterCategory] = useState("all");
  const [search, setSearch] = useState("");

  // Dialogs
  const [adjustDialog, setAdjustDialog] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);

  // Adjust state
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [adjType, setAdjType] = useState<"in" | "out">("in");
  const [adjQty, setAdjQty] = useState("1");
  const [adjReason, setAdjReason] = useState("");

  // Add/Edit form
  const [form, setForm] = useState({ name: "", category: "Lácteos", stock: "0", minStock: "1", unit: "litro" });
  const [editTarget, setEditTarget] = useState<Ingredient | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [invRes, movRes] = await Promise.all([
        fetch("/api/ingredients"),
        fetch("/api/ingredients/movements"),
      ]);
      if (invRes.ok) setData(await invRes.json());
      if (movRes.ok) setMovements(await movRes.json());
    } catch (e) {
      console.error("Error cargando inventario:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openAdjust(ingredient: Ingredient, type: "in" | "out") {
    setSelectedIngredient(ingredient);
    setAdjType(type);
    setAdjQty("1");
    setAdjReason("");
    setAdjustDialog(true);
  }

  function openEdit(ingredient: Ingredient) {
    setEditTarget(ingredient);
    setForm({ name: ingredient.name, category: ingredient.category, stock: String(ingredient.stock), minStock: String(ingredient.minStock), unit: ingredient.unit });
    setEditDialog(true);
  }

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedIngredient) return;
    setSaving(true);
    const res = await fetch("/api/ingredients/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredientId: selectedIngredient.id, type: adjType, quantity: adjQty, reason: adjReason }),
    });
    const d = await res.json();
    if (!res.ok) alert(d.error);
    else { setAdjustDialog(false); fetchData(); }
    setSaving(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const res = await fetch("/api/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Error al guardar el insumo");
      } else {
        setAddDialog(false);
        setFormError("");
        setForm({ name: "", category: "Lácteos", stock: "0", minStock: "1", unit: "litro" });
        fetchData();
      }
    } catch {
      setFormError("Error de conexión. Intenta de nuevo.");
    }
    setSaving(false);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setFormError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/ingredients/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, category: form.category, minStock: form.minStock, unit: form.unit }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Error al guardar");
      } else {
        setEditDialog(false);
        setFormError("");
        fetchData();
      }
    } catch {
      setFormError("Error de conexión. Intenta de nuevo.");
    }
    setSaving(false);
  }

  const filtered = (data?.ingredients ?? []).filter((i) => {
    const matchCat = filterCategory === "all" || i.category === filterCategory;
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const grouped = filtered.reduce<Record<string, Ingredient[]>>((acc, i) => {
    if (!acc[i.category]) acc[i.category] = [];
    acc[i.category].push(i);
    return acc;
  }, {});

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario de Insumos</h1>
          <p className="text-gray-500 text-sm mt-1">Control de ingredientes y materias primas</p>
        </div>
        <Button onClick={() => setAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo insumo
        </Button>
      </div>

      {data && data.lowStock.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {data.lowStock.length} insumo(s) con stock bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {data.lowStock.map((i) => (
                <div key={i.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-200">
                  <div>
                    <p className="text-sm font-medium">{i.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[i.category] ?? "bg-gray-100 text-gray-800"}`}>{i.category}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">{i.stock} {i.unit}</p>
                    <p className="text-xs text-gray-400">mín: {i.minStock}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 border-b">
        {(["stock", "movements"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? "border-amber-700 text-amber-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {tab === "stock" ? `Stock actual (${data?.ingredients.length ?? 0})` : "Historial de movimientos"}
          </button>
        ))}
      </div>

      {activeTab === "stock" && (
        <>
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Buscar insumo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
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

          {Object.keys(grouped).length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-lg font-medium">Sin insumos registrados</p>
              <p className="text-sm mt-1">Agrega tus ingredientes y materias primas</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[category] ?? "bg-gray-100 text-gray-800"}`}>{category}</span>
                    <span>{items.length} insumo(s)</span>
                  </h2>
                  <div className="space-y-2">
                    {items.map((ingredient) => {
                      const isLow = ingredient.stock <= ingredient.minStock;
                      const pct = Math.min((ingredient.stock / Math.max(ingredient.minStock * 3, 1)) * 100, 100);
                      return (
                        <Card key={ingredient.id} className={isLow ? "border-red-200" : ""}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium">{ingredient.name}</p>
                                  {isLow && <Badge variant="destructive" className="text-xs">Stock bajo</Badge>}
                                </div>
                                <div className="mt-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className={`text-lg font-bold ${isLow ? "text-red-600" : "text-gray-900"}`}>
                                      {ingredient.stock} <span className="text-sm font-normal text-gray-500">{ingredient.unit}</span>
                                    </span>
                                    <span className="text-xs text-gray-400">mín: {ingredient.minStock} {ingredient.unit}</span>
                                  </div>
                                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${isLow ? "bg-red-500" : pct < 50 ? "bg-yellow-400" : "bg-green-500"}`}
                                      style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1">
                                <Button size="sm" variant="outline" onClick={() => openAdjust(ingredient, "in")} className="text-green-700 border-green-300 hover:bg-green-50">
                                  <TrendingUp className="h-3 w-3 mr-1" /> Entrada
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => openAdjust(ingredient, "out")} disabled={ingredient.stock <= 0} className="text-red-700 border-red-300 hover:bg-red-50">
                                  <TrendingDown className="h-3 w-3 mr-1" /> Salida
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => openEdit(ingredient)} className="text-gray-500">
                                  <Pencil className="h-3 w-3 mr-1" /> Editar
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "movements" && (
        <div className="space-y-2">
          {movements.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>Sin movimientos registrados</p>
            </div>
          ) : (
            movements.map((m) => (
              <Card key={m.id}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${m.type === "in" ? "bg-green-100" : "bg-red-100"}`}>
                      {m.type === "in" ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{m.ingredient.name}</p>
                      <p className="text-xs text-gray-500">
                        <span className={`px-1.5 py-0.5 rounded text-xs ${CATEGORY_COLORS[m.ingredient.category] ?? "bg-gray-100 text-gray-700"}`}>{m.ingredient.category}</span>
                        {m.reason && <span className="ml-2">· {m.reason}</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${m.type === "in" ? "text-green-600" : "text-red-600"}`}>
                        {m.type === "in" ? "+" : "-"}{m.quantity} {m.ingredient.unit}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(m.createdAt).toLocaleDateString("es-MX")} {new Date(m.createdAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Adjust Dialog */}
      <Dialog open={adjustDialog} onOpenChange={setAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{adjType === "in" ? "Registrar entrada" : "Registrar salida"}</DialogTitle>
          </DialogHeader>
          {selectedIngredient && (
            <form onSubmit={handleAdjust} className="space-y-4 mt-2">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedIngredient.name}</p>
                <p className="text-sm text-gray-500">Stock actual: <strong>{selectedIngredient.stock} {selectedIngredient.unit}</strong></p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad ({selectedIngredient.unit})</label>
                  <Input type="number" min="0.01" step="0.01" value={adjQty} onChange={(e) => setAdjQty(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
                  <Input value={adjReason} onChange={(e) => setAdjReason(e.target.value)} placeholder="Ej. Compra, merma..." />
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setAdjustDialog(false)}>Cancelar</Button>
                <Button type="submit" className="flex-1" variant={adjType === "in" ? "success" : "destructive"} disabled={saving}>
                  {saving ? "Guardando..." : adjType === "in" ? "Registrar entrada" : "Registrar salida"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Ingredient Dialog */}
      <Dialog open={addDialog} onOpenChange={(open) => { setAddDialog(open); if (!open) setFormError(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo insumo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del insumo</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Ej. Leche entera" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock inicial</label>
                <Input type="number" min="0" step="0.01" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo (alerta)</label>
                <Input type="number" min="0" step="0.01" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
              </div>
            </div>
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-3 py-2 text-sm">{formError}</div>
            )}
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => { setAddDialog(false); setFormError(""); }}>Cancelar</Button>
              <Button type="submit" className="flex-1" disabled={saving}>{saving ? "Guardando..." : "Agregar insumo"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Ingredient Dialog */}
      <Dialog open={editDialog} onOpenChange={(open) => { setEditDialog(open); if (!open) setFormError(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar insumo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo para alerta</label>
              <Input type="number" min="0" step="0.01" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
            </div>
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-3 py-2 text-sm">{formError}</div>
            )}
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => { setEditDialog(false); setFormError(""); }}>Cancelar</Button>
              <Button type="submit" className="flex-1" disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
