"use client";

import { useEffect, useState } from "react";

import HabitacionTable from "@/components/HabitacionTable";
import HabitacionForm from "@/components/HabitacionForm";

import { supabase } from "@/lib/supabase";

type Habitacion = {
  id: string;
  vivienda_id: string;
  codigo: string;
  tipo: "INDIVIDUAL" | "PAREJA";
  precio: number;
  gastos: number;
  fianza_meses: number;
  estado: "LIBRE" | "OCUPADA" | "RESERVADA";
  disponible_desde: string | null;
  observaciones: string | null;
};

type Vivienda = {
  id: string;
  nombre: string;
};

type Inquilino = {
  id: string;
  habitacion_id: string;
  activo: boolean;
};

export default function HabitacionesPage() {
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [viviendas, setViviendas] = useState<Vivienda[]>([]);
  const [inquilinos, setInquilinos] = useState<Inquilino[]>([]);
  const [filtroVivienda, setFiltroVivienda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"" | Habitacion["estado"]>("");

  const [formularioAbierto, setFormularioAbierto] =
    useState(false);

  const [habitacionEditar, setHabitacionEditar] =
    useState<Habitacion | null>(null);

  const [cargando, setCargando] =
    useState(true);
      useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);

    const [
      { data: habitacionesData, error: errorHabitaciones },
      { data: viviendasData, error: errorViviendas },
      { data: inquilinosData, error: errorInquilinos },
    ] = await Promise.all([
      supabase
        .from("habitaciones")
        .select("*")
        .order("codigo"),

      supabase
        .from("viviendas")
        .select("*")
        .order("nombre"),

      supabase
        .from("inquilinos")
        .select("*")
        .eq("activo", true),
    ]);

    if (errorHabitaciones) {
      console.error(errorHabitaciones);
      alert(errorHabitaciones.message);
      setCargando(false);
      return;
    }

    if (errorViviendas) {
      console.error(errorViviendas);
      alert(errorViviendas.message);
      setCargando(false);
      return;
    }

    if (errorInquilinos) {
      console.error(errorInquilinos);
      alert(errorInquilinos.message);
      setCargando(false);
      return;
    }

    setHabitaciones(habitacionesData ?? []);
    setViviendas(viviendasData ?? []);
    setInquilinos(inquilinosData ?? []);

    setCargando(false);
  }

  async function eliminarHabitacion(id: string) {
    const confirmar = confirm(
      "¿Desea eliminar esta habitación?"
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("habitaciones")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await cargarDatos();
  }
  const habitacionesFiltradas = habitaciones.filter((habitacion) => {
    if (filtroVivienda && habitacion.vivienda_id !== filtroVivienda) return false;
    if (filtroEstado && habitacion.estado !== filtroEstado) return false;

    return true;
  });
    const ocupantes = inquilinos
    .filter((inquilino) => inquilino.activo)
    .map((inquilino) => ({
      habitacion_id: inquilino.habitacion_id,
    }));

  if (cargando) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
        }}
      >
        Cargando habitaciones...
      </div>
    );
  }

  return (
    <>
      <div className="rf-page-header">
        <div><h1 className="rf-page-title">Habitaciones</h1><p className="rf-page-description">Consulta la ocupación y gestiona cada habitación.</p></div>

        <button
          className="rf-primary-action"
          onClick={() => {
            setHabitacionEditar(null);
            setFormularioAbierto(true);
          }}
        >
          + Nueva habitación
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="flex min-w-52 flex-1 flex-col gap-1 text-sm font-medium text-slate-700">
          Vivienda
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-normal text-slate-900 outline-none focus:border-blue-500"
            value={filtroVivienda}
            onChange={(event) => setFiltroVivienda(event.target.value)}
          >
            <option value="">Todas las viviendas</option>
            {viviendas.map((vivienda) => (
              <option key={vivienda.id} value={vivienda.id}>{vivienda.nombre}</option>
            ))}
          </select>
        </label>
        <label className="flex min-w-44 flex-1 flex-col gap-1 text-sm font-medium text-slate-700">
          Estado
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-normal text-slate-900 outline-none focus:border-blue-500"
            value={filtroEstado}
            onChange={(event) => setFiltroEstado(event.target.value as "" | Habitacion["estado"])}
          >
            <option value="">Todos los estados</option>
            <option value="LIBRE">Libre</option>
            <option value="OCUPADA">Ocupada</option>
            <option value="RESERVADA">Reservada</option>
          </select>
        </label>
        <div className="flex items-center gap-3 pb-1 text-sm text-slate-500">
          <span>{habitacionesFiltradas.length} {habitacionesFiltradas.length === 1 ? <>habitaci{"\u00f3"}n</> : "habitaciones"}</span>
          {(filtroVivienda || filtroEstado) && (
            <button
              type="button"
              className="font-medium text-blue-600 hover:text-blue-800"
              onClick={() => {
                setFiltroVivienda("");
                setFiltroEstado("");
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      <HabitacionTable
        habitaciones={habitacionesFiltradas}
        viviendas={viviendas}
        ocupantes={ocupantes}
        onEditar={(habitacion) => {
          setHabitacionEditar(habitacion);
          setFormularioAbierto(true);
        }}
        onEliminar={eliminarHabitacion}
      />
            <HabitacionForm
        abierto={formularioAbierto}
        habitacion={habitacionEditar}
        viviendas={viviendas}
        onClose={() => {
          setFormularioAbierto(false);
          setHabitacionEditar(null);
        }}
        onGuardado={async () => {
          setFormularioAbierto(false);
          setHabitacionEditar(null);
          await cargarDatos();
        }}
      />
          </>
  );
}
