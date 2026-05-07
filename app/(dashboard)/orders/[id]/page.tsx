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
  const [cart, setCart] = useState<Record<string, { product: Product; quantity: number }>>({});
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

  function cartAdd(product: Product) {
    setCart((prev) => {
      const existing = prev[product.id];
      const newQty = (existing?.quantity ?? 0) + 1;
      if (newQty > product.stock) return prev;
      return { ...prev, [product.id]: { product, quantity: newQty } };
    });
  }

  function cartRemove(productId: string) {
    setCart((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return { ...prev, [productId]: { ...existing, quantity: existing.quantity - 1 } };
    });
  }

  function cartReset() {
    setCart({});
    setSearch("");
    setSelectedCategory("all");
  }

  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0);
  const cartCount = cartItems.reduce((sum, { quantity }) => sum + quantity, 0);

  async function handleAddItems() {
    if (cartItems.length === 0) return;
    setProcessing(true);
    const res = await fetch(`/api/orders/${id}/items/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cartItems.map(({ product, quantity }) => ({ productId: product.id, quantity })) }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
    } else {
      setAddDialogOpen(false);
      cartReset();
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
      <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) cartReset(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Agregar productos</DialogTitle>
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

          <div className="flex gap-2 flex-wrap">
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

          <div className="overflow-y-auto flex-1">
            {filteredProducts.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Sin productos</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filteredProducts.map((product) => {
                  const inCart = cart[product.id]?.quantity ?? 0;
                  const outOfStock = product.stock <= 0;
                  return (
                    <div
                      key={product.id}
                      className={`p-3 rounded-lg border-2 transition-colors ${inCart > 0 ? "border-amber-400 bg-amber-50" : "border-gray-200"} ${outOfStock ? "opacity-50" : ""}`}
                    >
                      <p className="font-medium text-sm leading-tight">{product.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{product.category.name}</p>
                      <p className="text-sm font-bold text-amber-700 mt-1">{formatCurrency(product.price)}</p>
                      <div className="flex items-center justify-between mt-2">
                        {inCart > 0 ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => cartRemove(product.id)}
                              className="h-7 w-7 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-100 font-bold text-base leading-none"
                            >
                              −
                            </button>
                            <span className="font-bold text-amber-700 min-w-[20px] text-center">{inCart}</span>
                            <button
                              onClick={() => cartAdd(product)}
                              disabled={inCart >= product.stock}
                              className="h-7 w-7 rounded-full bg-amber-700 text-white flex items-center justify-center hover:bg-amber-800 disabled:opacity-40 font-bold text-base leading-none"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => cartAdd(product)}
                            disabled={outOfStock}
                            className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-700 text-white text-xs font-medium hover:bg-amber-800 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Plus className="h-3 w-3" /> Agregar
                          </button>
                        )}
                        <span className="text-xs text-gray-400">{product.stock} disp.</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart summary bar */}
          <div className={`border-t pt-3 transition-all ${cartItems.length > 0 ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{cartCount} producto(s) seleccionado(s)</span>
              <span className="font-bold text-amber-700">{formatCurrency(cartTotal)}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={cartReset}>Limpiar</Button>
              <Button className="flex-1" onClick={handleAddItems} disabled={processing || cartItems.length === 0}>
                {processing ? "Agregando..." : `Agregar ${cartCount > 0 ? cartCount : ""} a la orden`}
              </Button>
            </div>
          </div>
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
