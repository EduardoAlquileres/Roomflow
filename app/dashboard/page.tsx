"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import KpiCard from "@/components/KpiCard";

type Vivienda = {
  id: string;
  nombre: string;
};

type Habitacion = {
  id: string;
  estado: string;
};

export default function Dashboard() {
  const [viviendas, setViviendas] = useState<Vivienda[]>([]);
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);

  useEffect(() => {
    async function cargar() {
      const { data: viviendasData } = await supabase
        .from("viviendas")
        .select("*");

      const { data: habitacionesData } = await supabase
        .from("habitaciones")
        .select("*");

      setViviendas(viviendasData ?? []);
      setHabitaciones(habitacionesData ?? []);
    }

    cargar();
  }, []);

  const libres = habitaciones.filter(
    (h) => h.estado === "LIBRE"
  ).length;

  const ocupadas = habitaciones.filter(
    (h) => h.estado === "OCUPADA"
  ).length;

  return (
    <div>
      <div className="rf-page-header"><div><h1 className="rf-page-title">Resumen general</h1><p className="rf-page-description">Una visión rápida del estado de tus viviendas y habitaciones.</p></div></div>
      <div className="rf-kpi-grid">
        <KpiCard titulo="Viviendas" valor={viviendas.length} />
        <KpiCard titulo="Habitaciones" valor={habitaciones.length} />
        <KpiCard titulo="Libres" valor={libres} />
        <KpiCard titulo="Ocupadas" valor={ocupadas} />
      </div>
    </div>
  );
}
