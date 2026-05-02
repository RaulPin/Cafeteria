"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  DollarSign,
  ShoppingBag,
  ClipboardList,
  AlertTriangle,
  CreditCard,
  Banknote,
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  openOrders: number;
  todayClosedOrders: number;
  todayRevenue: number;
  todayCash: number;
  todayCard: number;
  lowStockCount: number;
  lowStockProducts: Array<{ id: string; name: string; stock: number; minStock: number; unit: string; category: { name: string } }>;
  recentOrders: Array<{ id: string; total: number; closedAt: string; paymentMethod: string; table: { number: number; type: string } }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    { label: "Órdenes abiertas", value: data.openOrders, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Ventas del día", value: formatCurrency(data.todayRevenue), icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
    { label: "Órdenes cerradas hoy", value: data.todayClosedOrders, icon: ShoppingBag, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Alertas de inventario", value: data.lowStockCount, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel de control</h1>
        <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.bg} p-3 rounded-full`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ventas por método de pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Efectivo</span>
              </div>
              <span className="font-bold text-green-700">{formatCurrency(data.todayCash)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Tarjeta</span>
              </div>
              <span className="font-bold text-blue-700">{formatCurrency(data.todayCard)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
              <span className="text-sm font-bold">Total del día</span>
              <span className="font-bold text-lg">{formatCurrency(data.todayRevenue)}</span>
            </div>
          </CardContent>
        </Card>

        {data.lowStockCount > 0 && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                Alerta: Stock bajo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.lowStockProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.category.name}</p>
                    </div>
                    <Badge variant="destructive">
                      {p.stock} {p.unit}
                    </Badge>
                  </div>
                ))}
                {data.lowStockCount > 5 && (
                  <Link href="/inventory" className="text-xs text-red-600 hover:underline block text-center pt-2">
                    Ver todos ({data.lowStockCount})
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimas órdenes cerradas</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentOrders.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin órdenes cerradas hoy</p>
            ) : (
              <div className="space-y-2">
                {data.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {order.table.type === "takeout" ? "Para llevar" : `Mesa ${order.table.number}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.closedAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatCurrency(order.total)}</p>
                      <Badge variant={order.paymentMethod === "cash" ? "success" : "secondary"} className="text-xs">
                        {order.paymentMethod === "cash" ? "Efectivo" : "Tarjeta"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
