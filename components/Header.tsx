"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
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

type ResultadoBusqueda = {
  id: string;
  tipo: "Vivienda" | "Habitación" | "Inquilino";
  titulo: string;
  detalle: string;
  href: string;
  textoBusqueda: string;
};

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function Header({ alAbrirMenu }: { alAbrirMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [consulta, setConsulta] = useState("");
  const [opciones, setOpciones] = useState<ResultadoBusqueda[]>([]);
  const [cargandoBusqueda, setCargandoBusqueda] = useState(false);
  const [busquedaCargada, setBusquedaCargada] = useState(false);
  const [busquedaAbierta, setBusquedaAbierta] = useState(false);

  const resultados = useMemo(() => {
    const termino = normalizar(consulta.trim());
    if (termino.length < 2) return [];
    return opciones.filter((opcion) => normalizar(opcion.textoBusqueda).includes(termino)).slice(0, 8);
  }, [consulta, opciones]);

  async function cargarBusqueda() {
    setBusquedaAbierta(true);
    if (busquedaCargada || cargandoBusqueda) return;
    setCargandoBusqueda(true);

    try {
      const [viviendasRespuesta, habitacionesRespuesta, inquilinosRespuesta] = await Promise.all([
        supabase.from("viviendas").select("id, nombre, direccion").order("nombre"),
        supabase.from("habitaciones").select("id, codigo, vivienda_id").order("codigo"),
        supabase.from("inquilinos").select("id, nombre, apellidos, documento, activo").order("apellidos"),
      ]);

      const error = viviendasRespuesta.error ?? habitacionesRespuesta.error ?? inquilinosRespuesta.error;
      if (error) throw error;

      const viviendas = viviendasRespuesta.data ?? [];
      const nombresViviendas = new Map(viviendas.map((vivienda) => [vivienda.id, vivienda.nombre]));

      setOpciones([
        ...viviendas.map((vivienda) => ({
          id: `vivienda-${vivienda.id}`,
          tipo: "Vivienda" as const,
          titulo: vivienda.nombre,
          detalle: vivienda.direccion || "Vivienda",
          href: `/viviendas/${vivienda.id}`,
          textoBusqueda: `${vivienda.nombre} ${vivienda.direccion ?? ""}`,
        })),
        ...(habitacionesRespuesta.data ?? []).map((habitacion) => {
          const vivienda = nombresViviendas.get(habitacion.vivienda_id) ?? "Vivienda";
          return {
            id: `habitacion-${habitacion.id}`,
            tipo: "Habitación" as const,
            titulo: habitacion.codigo,
            detalle: vivienda,
            href: `/habitaciones/${habitacion.id}`,
            textoBusqueda: `${habitacion.codigo} ${vivienda}`,
          };
        }),
        ...(inquilinosRespuesta.data ?? []).map((inquilino) => ({
          id: `inquilino-${inquilino.id}`,
          tipo: "Inquilino" as const,
          titulo: `${inquilino.nombre} ${inquilino.apellidos}`,
          detalle: `${inquilino.documento} · ${inquilino.activo ? "Activo" : "Histórico"}`,
          href: `/inquilinos/${inquilino.id}`,
          textoBusqueda: `${inquilino.nombre} ${inquilino.apellidos} ${inquilino.documento}`,
        })),
      ]);
      setBusquedaCargada(true);
    } catch (error) {
      console.error("No se pudo cargar el buscador", error);
    } finally {
      setCargandoBusqueda(false);
    }
  }

  function abrirResultado(resultado: ResultadoBusqueda) {
    setConsulta("");
    setBusquedaAbierta(false);
    router.push(resultado.href);
  }

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
          onFocus={cargarBusqueda}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setBusquedaAbierta(false);
          }}
          style={{
            position: "relative",
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
            value={consulta}
            onChange={(event) => {
              setConsulta(event.target.value);
              setBusquedaAbierta(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && resultados[0]) abrirResultado(resultados[0]);
              if (event.key === "Escape") setBusquedaAbierta(false);
            }}
            aria-label="Buscar viviendas, habitaciones o inquilinos"
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              width: "100%",
              fontSize: 14,
            }}
          />

          {busquedaAbierta && consulta.trim().length >= 2 && (
            <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-full min-w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              {cargandoBusqueda && <p className="px-4 py-3 text-sm text-slate-500">Buscando...</p>}
              {!cargandoBusqueda && resultados.length === 0 && (
                <p className="px-4 py-3 text-sm text-slate-500">No se encontraron resultados.</p>
              )}
              {resultados.map((resultado) => (
                <button
                  key={resultado.id}
                  type="button"
                  onClick={() => abrirResultado(resultado)}
                  className="flex w-full items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-blue-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-900">{resultado.titulo}</span>
                    <span className="block truncate text-xs text-slate-500">{resultado.detalle}</span>
                  </span>
                  <span className="shrink-0 text-xs font-medium text-blue-700">{resultado.tipo}</span>
                </button>
              ))}
            </div>
          )}
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
