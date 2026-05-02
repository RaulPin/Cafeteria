"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Coffee,
  ClipboardList,
  Package,
  BarChart3,
  LogOut,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/tables", label: "Mesas", icon: UtensilsCrossed },
  { href: "/orders", label: "Órdenes", icon: ClipboardList },
  { href: "/menu", label: "Menú", icon: Coffee },
  { href: "/inventory", label: "Inventario", icon: Package },
  { href: "/reports", label: "Reportes", icon: BarChart3 },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-amber-900 text-white flex flex-col z-40">
      <div className="p-6 border-b border-amber-800">
        <div className="flex items-center gap-3">
          <Coffee className="h-8 w-8 text-amber-300" />
          <div>
            <h1 className="font-bold text-lg leading-tight">Cafetería</h1>
            <p className="text-amber-300 text-xs">Sistema de gestión</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-amber-700 text-white"
                : "text-amber-200 hover:bg-amber-800 hover:text-white"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-amber-800">
        <div className="flex items-center gap-3 mb-3 px-3">
          <div className="h-8 w-8 rounded-full bg-amber-700 flex items-center justify-center text-sm font-bold">
            {session?.user?.name?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{session?.user?.name}</p>
            <p className="text-xs text-amber-300">Administrador</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full justify-start text-amber-200 hover:text-white hover:bg-amber-800"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
}
