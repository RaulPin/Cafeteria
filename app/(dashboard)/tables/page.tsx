"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { Plus, UtensilsCrossed, ShoppingBag, ClipboardList } from "lucide-react";
import { useRouter } from "next/navigation";

interface Order {
  id: string;
  total: number;
  items: Array<{ id: string; quantity: number; price: number; product: { name: string } }>;
  createdAt: string;
}

interface Table {
  id: string;
  number: number;
  type: string;
  orders: Order[];
}

export default function TablesPage() {
  const router = useRouter();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [newTableType, setNewTableType] = useState<"physical" | "takeout">("physical");
  const [creating, setCreating] = useState(false);
  const [openingOrder, setOpeningOrder] = useState<string | null>(null);

  const fetchTables = useCallback(async () => {
    const res = await fetch("/api/tables");
    const data = await res.json();
    setTables(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  async function handleAddTable(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    await fetch("/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: newTableNumber, type: newTableType }),
    });
    setNewTableNumber("");
    setNewTableType("physical");
    setAddDialogOpen(false);
    setCreating(false);
    fetchTables();
  }

  async function handleOpenOrder(tableId: string) {
    setOpeningOrder(tableId);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableId }),
    });
    const data = await res.json();
    setOpeningOrder(null);
    if (res.ok) {
      router.push(`/orders/${data.id}`);
    } else {
      alert(data.error);
    }
  }

  const physicalTables = tables.filter((t) => t.type === "physical");
  const takeoutTables = tables.filter((t) => t.type === "takeout");

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mesas y órdenes</h1>
          <p className="text-gray-500 text-sm mt-1">Gestión de mesas físicas y órdenes para llevar</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Agregar mesa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva mesa</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddTable} className="space-y-4 mt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                <Input
                  type="number"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  min={1}
                  required
                  placeholder="Ej. 5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTableType("physical")}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${newTableType === "physical" ? "border-amber-700 bg-amber-50 text-amber-800" : "border-gray-200"}`}
                  >
                    <UtensilsCrossed className="h-5 w-5 mx-auto mb-1" />
                    Mesa física
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTableType("takeout")}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${newTableType === "takeout" ? "border-amber-700 bg-amber-50 text-amber-800" : "border-gray-200"}`}
                  >
                    <ShoppingBag className="h-5 w-5 mx-auto mb-1" />
                    Para llevar
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Creando..." : "Crear mesa"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {physicalTables.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5" /> Mesas físicas
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {physicalTables.map((table) => {
              const openOrder = table.orders[0];
              const isOccupied = !!openOrder;
              return (
                <Card
                  key={table.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${isOccupied ? "border-amber-400 bg-amber-50" : "border-green-300 bg-green-50"}`}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`text-3xl font-bold mb-2 ${isOccupied ? "text-amber-700" : "text-green-700"}`}>
                      {table.number}
                    </div>
                    <Badge variant={isOccupied ? "warning" : "success"} className="mb-3">
                      {isOccupied ? "Ocupada" : "Disponible"}
                    </Badge>
                    {isOccupied ? (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{openOrder.items.length} productos</p>
                        <p className="text-sm font-bold text-amber-800 mb-2">{formatCurrency(openOrder.total)}</p>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => router.push(`/orders/${openOrder.id}`)}
                        >
                          <ClipboardList className="h-3 w-3 mr-1" />
                          Ver cuenta
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="success"
                        className="w-full"
                        onClick={() => handleOpenOrder(table.id)}
                        disabled={openingOrder === table.id}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {openingOrder === table.id ? "..." : "Abrir cuenta"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {takeoutTables.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" /> Para llevar
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {takeoutTables.map((table) => {
              const openOrder = table.orders[0];
              const isOccupied = !!openOrder;
              return (
                <Card
                  key={table.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${isOccupied ? "border-amber-400 bg-amber-50" : "border-gray-200"}`}
                >
                  <CardContent className="p-4 text-center">
                    <ShoppingBag className={`h-8 w-8 mx-auto mb-2 ${isOccupied ? "text-amber-700" : "text-gray-400"}`} />
                    <p className="text-sm font-semibold text-gray-700 mb-1">Orden #{table.number}</p>
                    <Badge variant={isOccupied ? "warning" : "secondary"} className="mb-3">
                      {isOccupied ? "En proceso" : "Disponible"}
                    </Badge>
                    {isOccupied ? (
                      <Button size="sm" className="w-full" onClick={() => router.push(`/orders/${openOrder.id}`)}>
                        Ver cuenta
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleOpenOrder(table.id)}
                        disabled={openingOrder === table.id}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Nueva orden
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {tables.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <UtensilsCrossed className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">Sin mesas configuradas</p>
          <p className="text-sm mt-1">Agrega mesas para comenzar a gestionar órdenes</p>
        </div>
      )}
    </div>
  );
}
