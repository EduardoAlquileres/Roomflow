"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  Users,
  Wallet,
  MessageSquare,
  CalendarDays,
  ShieldCheck,
  ReceiptText,
  X,
} from "lucide-react";

const menu = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Viviendas",
    href: "/viviendas",
    icon: Building2,
  },
  {
    name: "Habitaciones",
    href: "/habitaciones",
    icon: DoorOpen,
  },
  {
    name: "Inquilinos",
    href: "/inquilinos",
    icon: Users,
  },
  {
    name: "Cobros",
    href: "/cobros",
    icon: Wallet,
  },
  {
    name: "Fianzas",
    href: "/fianzas",
    icon: ShieldCheck,
  },
  {
    name: "Gastos",
    href: "/gastos",
    icon: ReceiptText,
  },
  {
    name: "Mensajes",
    href: "/mensajes",
    icon: MessageSquare,
  },
  {
    name: "Agenda",
    href: "/agenda",
    icon: CalendarDays,
  },
];

export default function Sidebar({ abierto, alNavegar }: { abierto: boolean; alNavegar: () => void }) {
  const pathname = usePathname();

  return (
    <aside className={`rf-sidebar ${abierto ? "rf-sidebar-open" : ""}`}
      style={{
        width: 270,
        background: "#0f172a",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        padding: "24px 18px",
        borderRight: "1px solid #1e293b",
      }}
    >
     <div className="rf-sidebar-mobile-head"><span>Menú</span><button type="button" onClick={alNavegar} aria-label="Cerrar menú"><X size={22} /></button></div>
     <Link
  href="/dashboard"
  style={{
    textDecoration: "none",
    color: "#fff",
  }}
>
  <div
    style={{
      fontSize: 28,
      fontWeight: 700,
      letterSpacing: 1,
    }}
  >
    ROOMFLOW
  </div>

  <div
    style={{
      marginTop: 4,
      color: "#94a3b8",
      fontSize: 13,
    }}
  >
    Gestión de habitaciones
  </div>
</Link>

      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          flex: 1,
        }}
      >
        {menu.map((item) => {
          const Icon = item.icon;

          const activo =
            pathname === item.href ||
            pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={alNavegar}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 16px",
                textDecoration: "none",
                borderRadius: 12,
                transition: "0.2s",
                background: activo ? "#2563eb" : "transparent",
                color: activo ? "#ffffff" : "#cbd5e1",
                fontWeight: activo ? 600 : 500,
              }}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div
        style={{
          marginTop: 30,
          padding: 18,
          borderRadius: 12,
          background: "#1e293b",
        }}
      >
        <div
          style={{
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          Eduardo
        </div>

        <div
          style={{
            color: "#94a3b8",
            fontSize: 13,
          }}
        >
          Administrador
        </div>
      </div>
    </aside>
  );
}
