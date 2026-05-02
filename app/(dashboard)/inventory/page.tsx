"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { AlertTriangle, Package, Plus, Minus, ArrowDownUp, TrendingUp, TrendingDown } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  minStock: number;
  unit: string;
  category: { name: string; color: string };
}

interface Movement {
  id: string;
  type: string;
  quantity: number;
  reason?: string;
  createdAt: string;
  product: { name: string; category: { name: string } };
}

export default function InventoryPage() {
  const [data, setData] = useState<{ products: Product[]; lowStock: Product[] } | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"stock" | "movements">("stock");
  const [adjustDialog, setAdjustDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjType, setAdjType] = useState<"in" | "out">("in");
  const [adjQty, setAdjQty] = useState("1");
  const [adjReason, setAdjReason] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    const [inv, mov] = await Promise.all([
      fetch("/api/inventory").then((r) => r.json()),
      fetch("/api/inventory/movements").then((r) => r.json()),
    ]);
    setData(inv);
    setMovements(mov);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openAdjust(product: Product, type: "in" | "out") {
    setSelectedProduct(product);
    setAdjType(type);
    setAdjQty("1");
    setAdjReason("");
    setAdjustDialog(true);
  }

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProduct) return;
    setSaving(true);
    const res = await fetch("/api/inventory/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: selectedProduct.id, type: adjType, quantity: adjQty, reason: adjReason }),
    });
    const resData = await res.json();
    if (!res.ok) {
      alert(resData.error);
    } else {
      setAdjustDialog(false);
      fetchData();
    }
    setSaving(false);
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Cargando...</div>;
  if (!data) return null;

  const { products, lowStock } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
        <p className="text-gray-500 text-sm mt-1">Control de stock y movimientos</p>
      </div>

      {lowStock.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {lowStock.length} producto(s) con stock bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-white rounded-lg p-2 border border-red-200">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.category.name}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive">{p.stock} {p.unit}</Badge>
                    <p className="text-xs text-gray-400 mt-0.5">min: {p.minStock}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 border-b">
        {(["stock", "movements"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? "border-amber-700 text-amber-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            {tab === "stock" ? "Stock actual" : "Movimientos recientes"}
          </button>
        ))}
      </div>

      {activeTab === "stock" && (
        <div className="space-y-3">
          {products.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>Sin productos en inventario</p>
            </div>
          ) : (
            products.map((product) => {
              const isLow = product.stock <= product.minStock;
              return (
                <Card key={product.id} className={isLow ? "border-red-200" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{product.name}</p>
                          {isLow && <Badge variant="destructive" className="text-xs">Stock bajo</Badge>}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {product.category.name} · Precio: {formatCurrency(product.price)}
                        </p>
                      </div>
                      <div className="text-center min-w-[100px]">
                        <p className={`text-xl font-bold ${isLow ? "text-red-600" : "text-gray-900"}`}>
                          {product.stock}
                        </p>
                        <p className="text-xs text-gray-400">{product.unit} (min: {product.minStock})</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openAdjust(product, "in")} title="Agregar stock">
                          <Plus className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openAdjust(product, "out")} disabled={product.stock <= 0} title="Restar stock">
                          <Minus className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isLow ? "bg-red-500" : "bg-green-500"}`}
                          style={{ width: `${Math.min((product.stock / (product.minStock * 3)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {activeTab === "movements" && (
        <div className="space-y-2">
          {movements.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ArrowDownUp className="h-12 w-12 mx-auto mb-3 opacity-40" />
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
                      <p className="text-sm font-medium truncate">{m.product.name}</p>
                      <p className="text-xs text-gray-500">{m.product.category.name}{m.reason ? ` · ${m.reason}` : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${m.type === "in" ? "text-green-600" : "text-red-600"}`}>
                        {m.type === "in" ? "+" : "-"}{m.quantity}
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

      <Dialog open={adjustDialog} onOpenChange={setAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adjType === "in" ? "Entrada de inventario" : "Salida de inventario"}
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <form onSubmit={handleAdjust} className="space-y-4 mt-2">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedProduct.name}</p>
                <p className="text-sm text-gray-500">Stock actual: <strong>{selectedProduct.stock} {selectedProduct.unit}</strong></p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={adjQty}
                  onChange={(e) => setAdjQty(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
                <Input
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="Ej. Reabastecimiento, ajuste..."
                />
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
    </div>
  );
}
