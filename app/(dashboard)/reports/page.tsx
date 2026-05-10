"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { BarChart3, Download, FileSpreadsheet, Banknote, CreditCard, CheckCircle, Loader2 } from "lucide-react";

interface CategoryBreakdown {
  name: string;
  total: number;
  qty: number;
}

interface ReportData {
  date: string;
  totalOrders: number;
  totalCash: number;
  totalCard: number;
  totalRevenue: number;
  categoryBreakdown: CategoryBreakdown[];
  orders: Array<{
    id: string;
    total: number;
    paymentMethod: string;
    closedAt: string;
    table: { number: number; type: string };
  }>;
}

export default function ReportsPage() {
  const [date, setDate] = useState(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [savingCut, setSavingCut] = useState(false);
  const [cutSaved, setCutSaved] = useState(false);

  async function fetchReport() {
    setLoading(true);
    setCutSaved(false);
    const res = await fetch(`/api/reports/cut?date=${date}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchReport(); }, [date]);

  async function handleExportExcel() {
    setExporting(true);
    const res = await fetch(`/api/reports/cut?date=${date}&format=excel`);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `corte-caja-${date}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setExporting(false);
  }

  async function handleSaveCut() {
    setSavingCut(true);
    await fetch("/api/reports/cut", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
    setCutSaved(true);
    setSavingCut(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Corte de caja</h1>
          <p className="text-gray-500 text-sm mt-1">Resumen de ventas por día</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Button variant="outline" onClick={handleExportExcel} disabled={exporting || !data}>
            {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
            Exportar Excel
          </Button>
          <Button
            variant="success"
            onClick={handleSaveCut}
            disabled={savingCut || cutSaved || !data || data.totalOrders === 0}
          >
            {cutSaved ? (
              <><CheckCircle className="h-4 w-4 mr-2" />Corte guardado</>
            ) : savingCut ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</>
            ) : (
              <>Generar corte de caja</>
            )}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          Cargando reporte...
        </div>
      ) : !data ? null : data.totalOrders === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">Sin ventas en esta fecha</p>
          <p className="text-sm mt-1">{new Date(date + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-500">Total del día</p>
                <p className="text-3xl font-bold text-amber-700 mt-1">{formatCurrency(data.totalRevenue)}</p>
                <p className="text-xs text-gray-400 mt-1">{data.totalOrders} órdenes cerradas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-1">
                  <Banknote className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-gray-500">Efectivo</p>
                </div>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(data.totalCash)}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {data.totalRevenue > 0 ? Math.round((data.totalCash / data.totalRevenue) * 100) : 0}% del total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <p className="text-sm text-gray-500">Tarjeta</p>
                </div>
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(data.totalCard)}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {data.totalRevenue > 0 ? Math.round((data.totalCard / data.totalRevenue) * 100) : 0}% del total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-500">Ticket promedio</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(data.totalOrders > 0 ? data.totalRevenue / data.totalOrders : 0)}
                </p>
                <p className="text-xs text-gray-400 mt-1">por orden</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ventas por categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.categoryBreakdown.map((cat) => (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{cat.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{cat.qty} uds</span>
                          <span className="text-sm font-bold">{formatCurrency(cat.total)}</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-600 rounded-full"
                          style={{ width: `${data.totalRevenue > 0 ? (cat.total / data.totalRevenue) * 100 : 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 text-right">
                        {data.totalRevenue > 0 ? Math.round((cat.total / data.totalRevenue) * 100) : 0}%
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detalle de órdenes</CardTitle>
              </CardHeader>
              <CardContent className="max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {data.orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {order.table.type === "takeout" ? "Para llevar" : `Mesa ${order.table.number}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.closedAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={order.paymentMethod === "cash" ? "success" : "secondary"}>
                          {order.paymentMethod === "cash" ? "Efectivo" : "Tarjeta"}
                        </Badge>
                        <span className="text-sm font-bold">{formatCurrency(order.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
