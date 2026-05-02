"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { ClipboardList, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

interface Order {
  id: string;
  status: string;
  total: number;
  paymentMethod?: string;
  createdAt: string;
  closedAt?: string;
  table: { number: number; type: string };
  items: Array<{ id: string }>;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");

  useEffect(() => {
    const params = filter !== "all" ? `?status=${filter}` : "";
    fetch(`/api/orders${params}`)
      .then((r) => r.json())
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [filter]);

  const filteredOrders = orders;

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Historial de órdenes</h1>
        <p className="text-gray-500 text-sm mt-1">Todas las órdenes del sistema</p>
      </div>

      <div className="flex gap-2">
        {(["all", "open", "closed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setLoading(true); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === f ? "bg-amber-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {f === "all" ? "Todas" : f === "open" ? "Abiertas" : "Cerradas"}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">Sin órdenes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold">
                        {order.table.type === "takeout" ? "Para llevar" : `Mesa ${order.table.number}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        #{order.id.slice(-8).toUpperCase()} · {new Date(order.createdAt).toLocaleDateString("es-MX")} {new Date(order.createdAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-amber-700">{formatCurrency(order.total)}</p>
                      <p className="text-xs text-gray-500">{order.items.length} producto(s)</p>
                    </div>
                    <Badge variant={order.status === "open" ? "warning" : "success"}>
                      {order.status === "open" ? "Abierta" : "Cerrada"}
                    </Badge>
                    {order.paymentMethod && (
                      <Badge variant={order.paymentMethod === "cash" ? "success" : "secondary"}>
                        {order.paymentMethod === "cash" ? "Efectivo" : "Tarjeta"}
                      </Badge>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => router.push(`/orders/${order.id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
