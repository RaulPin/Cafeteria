"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { Plus, Pencil, ToggleLeft, ToggleRight, Coffee } from "lucide-react";

interface Category {
  id: string;
  name: string;
  color: string;
  _count?: { products: number };
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  minStock: number;
  unit: string;
  active: boolean;
  category: Category;
}

const CATEGORY_COLORS = [
  { label: "Ámbar", value: "#92400E" },
  { label: "Verde", value: "#166534" },
  { label: "Azul", value: "#1D4ED8" },
  { label: "Rojo", value: "#DC2626" },
  { label: "Morado", value: "#7C3AED" },
  { label: "Rosa", value: "#DB2777" },
];

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"products" | "categories">("products");
  const [filterCategory, setFilterCategory] = useState("all");

  const [productDialog, setProductDialog] = useState(false);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const [form, setForm] = useState({ name: "", price: "", categoryId: "", minStock: "5", unit: "unidad" });
  const [catForm, setCatForm] = useState({ name: "", color: "#92400E" });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    const [prods, cats] = await Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]);
    setProducts(prods);
    setCategories(cats);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openAddProduct() {
    setEditProduct(null);
    setForm({ name: "", price: "", categoryId: categories[0]?.id ?? "", minStock: "5", unit: "unidad" });
    setProductDialog(true);
  }

  function openEditProduct(p: Product) {
    setEditProduct(p);
    setForm({ name: p.name, price: String(p.price), categoryId: p.category.id, minStock: String(p.minStock), unit: p.unit });
    setProductDialog(true);
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    if (editProduct) {
      await fetch(`/api/products/${editProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, price: form.price, categoryId: form.categoryId, minStock: form.minStock, unit: form.unit }),
      });
    } else {
      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, stock: 0 }),
      });
    }
    setSaving(false);
    setProductDialog(false);
    fetchData();
  }

  async function handleToggleProduct(product: Product) {
    await fetch(`/api/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !product.active }),
    });
    fetchData();
  }

  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(catForm),
    });
    setSaving(false);
    setCategoryDialog(false);
    setCatForm({ name: "", color: "#92400E" });
    fetchData();
  }

  const filteredProducts = filterCategory === "all"
    ? products
    : products.filter((p) => p.category.id === filterCategory);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menú</h1>
          <p className="text-gray-500 text-sm mt-1">Gestión de productos y categorías</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCategoryDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Categoría
          </Button>
          <Button onClick={openAddProduct}>
            <Plus className="h-4 w-4 mr-2" />
            Producto
          </Button>
        </div>
      </div>

      <div className="flex gap-2 border-b">
        {(["products", "categories"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? "border-amber-700 text-amber-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            {tab === "products" ? `Productos (${products.length})` : `Categorías (${categories.length})`}
          </button>
        ))}
      </div>

      {activeTab === "products" && (
        <>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterCategory("all")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterCategory === "all" ? "bg-amber-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterCategory === cat.id ? "bg-amber-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Coffee className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>Sin productos en esta categoría</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <Card key={product.id} className={!product.active ? "opacity-60" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{product.name}</p>
                        <Badge variant="secondary" className="text-xs mt-1">{product.category.name}</Badge>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEditProduct(product)} className="text-gray-400 hover:text-gray-600">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleToggleProduct(product)} className="text-gray-400 hover:text-gray-600">
                          {product.active ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-lg font-bold text-amber-700">{formatCurrency(product.price)}</span>
                      <span className={`text-xs ${product.stock <= product.minStock ? "text-red-600 font-medium" : "text-gray-500"}`}>
                        Stock: {product.stock} {product.unit}
                      </span>
                    </div>
                    {!product.active && <Badge variant="secondary" className="mt-2 text-xs">Inactivo</Badge>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "categories" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.color + "22", border: `2px solid ${cat.color}` }}>
                  <Coffee className="h-5 w-5" style={{ color: cat.color }} />
                </div>
                <div>
                  <p className="font-semibold">{cat.name}</p>
                  <p className="text-xs text-gray-500">{cat._count?.products ?? 0} productos</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Product Dialog */}
      <Dialog open={productDialog} onOpenChange={setProductDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editProduct ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveProduct} className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Ej. Cappuccino" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio ($)</label>
                <Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="pieza, ml, g..." />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo para alerta</label>
              <Input type="number" min="0" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setProductDialog(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1" disabled={saving || !form.categoryId}>{saving ? "Guardando..." : "Guardar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva categoría</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCategory} className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} required placeholder="Ej. Bebidas de café" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <div className="flex gap-2 flex-wrap">
                {CATEGORY_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCatForm({ ...catForm, color: c.value })}
                    className={`h-8 w-8 rounded-full transition-transform ${catForm.color === c.value ? "scale-125 ring-2 ring-offset-1 ring-gray-400" : ""}`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setCategoryDialog(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1" disabled={saving}>{saving ? "Guardando..." : "Crear categoría"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
