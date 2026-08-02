"use client";

import { usePathname } from "next/navigation";
import {
  Bell,
  Search,
  CalendarDays,
  House,
  DoorOpen,
  Users,
  CreditCard,
  MessageSquare,
  LayoutDashboard,
  Menu,
  LogOut,
} from "lucide-react";

export default function Header({ alAbrirMenu }: { alAbrirMenu: () => void }) {
  const pathname = usePathname();

  function getTitulo() {
    switch (pathname) {
      case "/dashboard":
        return {
          titulo: "Dashboard",
          icono: <LayoutDashboard size={24} />,
        };

      case "/viviendas":
        return {
          titulo: "Viviendas",
          icono: <House size={24} />,
        };

      case "/habitaciones":
        return {
          titulo: "Habitaciones",
          icono: <DoorOpen size={24} />,
        };

      case "/inquilinos":
        return {
          titulo: "Inquilinos",
          icono: <Users size={24} />,
        };

      case "/mensajes":
        return {
          titulo: "Mensajes",
          icono: <MessageSquare size={24} />,
        };

      case "/agenda":
        return {
          titulo: "Agenda",
          icono: <CalendarDays size={24} />,
        };

      case "/pagos":
        return {
          titulo: "Pagos",
          icono: <CreditCard size={24} />,
        };

      default:
        return {
          titulo: "RoomFlow",
          icono: <House size={24} />,
        };
    }
  }

  const pagina = getTitulo();

  async function salir() {
    await fetch("/api/acceso", { method: "DELETE" });
    window.location.assign("/acceso");
  }

  return (
    <header className="rf-header"
      style={{
        height: 80,
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 30px",
      }}
    >
      <div className="rf-header-brand"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <button type="button" className="rf-menu-button" onClick={alAbrirMenu} aria-label="Abrir menú"><Menu size={24} /></button>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            background: "#dbeafe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#2563eb",
          }}
        >
          {pagina.icono}
        </div>

        <div className="rf-header-copy">
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            {pagina.titulo}
          </div>

          <div
            style={{
              color: "#6b7280",
              fontSize: 14,
            }}
          >
            Gestión integral de RoomFlow
          </div>
        </div>
      </div>

      <div className="rf-header-actions"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div className="rf-search"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#f8fafc",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: "10px 14px",
            minWidth: 260,
          }}
        >
          <Search
            size={18}
            color="#6b7280"
          />

          <input
            placeholder="Buscar..."
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              width: "100%",
              fontSize: 14,
            }}
          />
        </div>

        <button className="rf-notification"
          style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            border: "none",
            background: "#f3f4f6",
            cursor: "pointer",
          }}
        >
          <Bell size={20} />
        </button>

        <button className="rf-logout" type="button" onClick={salir} title="Cerrar sesión" aria-label="Cerrar sesión"><LogOut size={19} /></button>

        <div className="rf-avatar"
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            background: "#2563eb",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          E
        </div>
      </div>
    </header>
  );
}
