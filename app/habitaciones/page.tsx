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

      <HabitacionTable
        habitaciones={habitaciones}
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
