"use client";

import { useEffect, useState } from "react";
import ViviendaTable from "@/components/ViviendaTable";
import ViviendaForm from "@/components/ViviendaForm";
import { supabase } from "@/lib/supabase";

type Vivienda = {
  id: string;
  nombre: string;
  direccion: string | null;
  activa: boolean;
};

type Habitacion = {
  id: string;
  vivienda_id: string;
  estado: string;
};

export default function Viviendas() {
  const [viviendas, setViviendas] = useState<Vivienda[]>([]);
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [viviendaEditar, setViviendaEditar] = useState<Vivienda | null>(null);

  async function cargarDatos() {
    const { data: viviendasData, error: errorViviendas } = await supabase
      .from("viviendas")
      .select("*")
      .order("nombre");

    if (errorViviendas) {
      console.error(errorViviendas);
      return;
    }

    const { data: habitacionesData, error: errorHabitaciones } =
      await supabase.from("habitaciones").select("*");

    if (errorHabitaciones) {
      console.error(errorHabitaciones);
      return;
    }

    setViviendas(viviendasData ?? []);
    setHabitaciones(habitacionesData ?? []);
  }

  async function eliminarVivienda(id: string) {
    const confirmar = confirm(
      "¿Está seguro de que desea eliminar esta vivienda?"
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("viviendas")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    cargarDatos();
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <>
      <div className="rf-page-header">
        <div><h1 className="rf-page-title">Viviendas</h1><p className="rf-page-description">Gestiona inmuebles, disponibilidad y titulares.</p></div>

        <button
          className="rf-primary-action"
          onClick={() => {
            setViviendaEditar(null);
            setFormularioAbierto(true);
          }}
        >
          + Nueva vivienda
        </button>
      </div>

      <ViviendaTable
        viviendas={viviendas}
        habitaciones={habitaciones}
        onEditar={(vivienda) => {
          setViviendaEditar(vivienda);
          setFormularioAbierto(true);
        }}
        onEliminar={eliminarVivienda}
      />

      <ViviendaForm
        abierto={formularioAbierto}
        vivienda={viviendaEditar}
        onClose={() => {
          setFormularioAbierto(false);
          setViviendaEditar(null);
        }}
        onGuardado={() => {
          cargarDatos();
          setFormularioAbierto(false);
          setViviendaEditar(null);
        }}
      />
    </>
  );
}
