"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CreditCard,
  Banknote,
  ShoppingCart,
  CheckCircle,
  Search,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  unit: string;
  category: Category;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  notes?: string;
  product: Product & { category: Category };
}

interface Order {
  id: string;
  status: string;
  total: number;
  paymentMethod?: string;
  closedAt?: string;
  createdAt: string;
  table: { number: number; type: string };
  items: OrderItem[];
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [processing, setProcessing] = useState(false);

  const fetchOrder = useCallback(async () => {
    const res = await fetch(`/api/orders/${id}`);
    if (res.ok) setOrder(await res.json());
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchOrder();
    Promise.all([
      fetch("/api/products?active=true").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([prods, cats]) => {
      setProducts(prods);
      setCategories(cats);
    });
  }, [fetchOrder]);

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === "all" || p.category.id === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProduct) return;
    setProcessing(true);
    const res = await fetch(`/api/orders/${id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: selectedProduct.id, quantity, notes }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
    } else {
      setAddDialogOpen(false);
      setSelectedProduct(null);
      setQuantity(1);
      setNotes("");
      fetchOrder();
    }
    setProcessing(false);
  }

  async function handleRemoveItem(itemId: string) {
    if (!confirm("¿Eliminar este producto de la orden?")) return;
    await fetch(`/api/orders/${id}/items`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    fetchOrder();
  }

  async function handleCloseOrder() {
    setProcessing(true);
    const res = await fetch(`/api/orders/${id}/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentMethod }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
      setProcessing(false);
    } else {
      setCloseDialogOpen(false);
      setOrder(data);
      setProcessing(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Cargando...</div>;
  if (!order) return <div className="text-center py-16 text-gray-500">Orden no encontrada</div>;

  const isClosed = order.status === "closed";

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/tables")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">
            {order.table.type === "takeout" ? "Para llevar" : `Mesa ${order.table.number}`}
          </h1>
          <p className="text-sm text-gray-500">
            Abierta a las {new Date(order.createdAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <Badge variant={isClosed ? "success" : "warning"} className="text-sm px-3 py-1">
          {isClosed ? "Cerrada" : "Abierta"}
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Productos en la orden</CardTitle>
            {!isClosed && (
              <Button size="sm" onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar producto
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {order.items.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Sin productos en la orden</p>
            </div>
          ) : (
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.product.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.quantity} × {formatCurrency(item.price)}
                      {item.notes && <span className="ml-2 text-amber-600">• {item.notes}</span>}
                    </p>
                  </div>
                  <p className="font-bold text-sm whitespace-nowrap">{formatCurrency(item.price * item.quantity)}</p>
                  {!isClosed && (
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg">Total</span>
              <span className="font-bold text-2xl text-amber-700">{formatCurrency(order.total)}</span>
            </div>
            {isClosed && (
              <p className="text-sm text-gray-500 mt-1">
                Pagado con {order.paymentMethod === "cash" ? "efectivo" : "tarjeta"} ·{" "}
                {order.closedAt && new Date(order.closedAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {!isClosed && (
        <Button
          className="w-full"
          size="lg"
          variant="success"
          disabled={order.items.length === 0}
          onClick={() => setCloseDialogOpen(true)}
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          Totalizar y cerrar cuenta
        </Button>
      )}

      {/* Add Product Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Agregar producto</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap mt-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedCategory === "all" ? "bg-amber-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedCategory === cat.id ? "bg-amber-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {selectedProduct ? (
            <form onSubmit={handleAddItem} className="space-y-4 mt-2">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="font-medium">{selectedProduct.name}</p>
                <p className="text-sm text-gray-600">{formatCurrency(selectedProduct.price)} · Stock: {selectedProduct.stock} {selectedProduct.unit}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                  <Input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Sin azúcar, extra..."
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setSelectedProduct(null)}>
                  Volver
                </Button>
                <Button type="submit" className="flex-1" disabled={processing}>
                  {processing ? "Agregando..." : `Agregar · ${formatCurrency(selectedProduct.price * quantity)}`}
                </Button>
              </div>
            </form>
          ) : (
            <div className="overflow-y-auto flex-1 mt-2">
              {filteredProducts.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Sin productos</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => { setSelectedProduct(product); setQuantity(1); }}
                      disabled={product.stock <= 0}
                      className="p-3 rounded-lg border border-gray-200 text-left hover:border-amber-400 hover:bg-amber-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{product.category.name}</p>
                      <p className="text-sm font-bold text-amber-700 mt-1">{formatCurrency(product.price)}</p>
                      <p className="text-xs text-gray-400">Stock: {product.stock} {product.unit}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Close Order Dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar cuenta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total a cobrar</span>
                <span className="text-2xl font-bold text-amber-700">{formatCurrency(order.total)}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Método de pago</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${paymentMethod === "cash" ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <Banknote className="h-8 w-8" />
                  <span className="font-medium">Efectivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${paymentMethod === "card" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <CreditCard className="h-8 w-8" />
                  <span className="font-medium">Tarjeta</span>
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setCloseDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="success" className="flex-1" onClick={handleCloseOrder} disabled={processing}>
                <CheckCircle className="h-4 w-4 mr-2" />
                {processing ? "Cerrando..." : "Confirmar y cerrar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
