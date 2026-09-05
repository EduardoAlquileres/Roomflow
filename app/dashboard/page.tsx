"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DoorOpen } from "lucide-react";
import { supabase } from "@/lib/supabase";

import KpiCard from "@/components/KpiCard";
import InformeSituacionButton from "@/components/InformeSituacionButton";

type Vivienda = {
  id: string;
  nombre: string;
};

type Habitacion = {
  id: string;
  estado: string;
  codigo: string;
  precio: number;
  gastos: number;
  viviendas: { nombre: string } | { nombre: string }[] | null;
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
        .select("id, estado, codigo, precio, gastos, viviendas(nombre)");

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

  const habitacionesLibres = habitaciones.filter((habitacion) => habitacion.estado === "LIBRE");

  return (
    <div>
      <div className="rf-page-header"><div><h1 className="rf-page-title">Resumen general</h1><p className="rf-page-description">Una visión rápida del estado de tus viviendas y habitaciones.</p></div><InformeSituacionButton /></div>
      <div className="rf-kpi-grid">
        <KpiCard titulo="Viviendas" valor={viviendas.length} />
        <KpiCard titulo="Habitaciones" valor={habitaciones.length} />
        <KpiCard titulo="Libres" valor={libres} />
        <KpiCard titulo="Ocupadas" valor={ocupadas} />
      </div>
      <section className="rf-availability-card">
        <div className="rf-availability-heading">
          <div className="rf-availability-icon"><DoorOpen size={22} /></div>
          <div><h2>Habitaciones disponibles</h2><p>Disponibilidad actual para preparar anuncios o gestionar una nueva entrada.</p></div>
        </div>
        {habitacionesLibres.length ? <div className="rf-availability-grid">
          {habitacionesLibres.map((habitacion) => {
            const viviendaHabitacion = Array.isArray(habitacion.viviendas) ? habitacion.viviendas[0] : habitacion.viviendas;
            return <article key={habitacion.id} className="rf-availability-item">
              <div><strong>{viviendaHabitacion?.nombre ?? "Vivienda"} · {habitacion.codigo}</strong><span>Libre</span></div>
              <p>Alquiler: {Number(habitacion.precio).toLocaleString("es-ES", { style: "currency", currency: "EUR" })} · Gastos: {Number(habitacion.gastos).toLocaleString("es-ES", { style: "currency", currency: "EUR" })} por persona</p>
              <Link href={`/habitaciones/${habitacion.id}`}>Ver habitación</Link>
            </article>;
          })}
        </div> : <p className="rf-availability-empty">No hay habitaciones libres en este momento.</p>}
      </section>
    </div>
  );
}
