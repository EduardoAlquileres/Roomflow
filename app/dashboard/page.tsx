"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DoorOpen } from "lucide-react";
import { supabase } from "#roomflow-supabase";
import { habitacionesDisponibles, textoDisponibilidad } from "@/lib/disponibilidad";

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
  disponible_desde: string | null;
  viviendas: { nombre: string } | { nombre: string }[] | null;
};

export default function Dashboard() {
  const [viviendas, setViviendas] = useState<Vivienda[]>([]);
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargar() {
      try {
        const [viviendasResultado, habitacionesResultado] = await Promise.all([
          supabase.from("viviendas").select("*"),
          supabase.from("habitaciones").select("id, estado, codigo, precio, gastos, disponible_desde, viviendas(nombre)"),
        ]);
        if (viviendasResultado.error || habitacionesResultado.error) throw new Error("No se pudo cargar la disponibilidad. Vuelve a cargar la página.");
        setViviendas(viviendasResultado.data ?? []);
        setHabitaciones(habitacionesResultado.data ?? []);
      } catch {
        setError("No se pudo cargar la disponibilidad. Vuelve a cargar la página.");
      } finally {
        setCargando(false);
      }
    }

    cargar();
  }, []);

  const libres = habitaciones.filter(
    (h) => h.estado === "LIBRE"
  ).length;

  const ocupadas = habitaciones.filter(
    (h) => h.estado === "OCUPADA"
  ).length;

  const disponibles = habitacionesDisponibles(habitaciones);
  const hoy = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });

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
          <div><h2>Habitaciones disponibles</h2><p>Habitaciones libres y próximas salidas para preparar anuncios o gestionar una nueva entrada.</p></div>
        </div>
        {cargando ? <p className="rf-availability-empty" role="status">Cargando disponibilidad…</p> : error ? <p className="rf-availability-empty" role="alert">{error}</p> : disponibles.length ? <div className="rf-availability-grid">
          {disponibles.map((habitacion) => {
            const viviendaHabitacion = Array.isArray(habitacion.viviendas) ? habitacion.viviendas[0] : habitacion.viviendas;
            return <article key={habitacion.id} className={`rf-availability-item${habitacion.estado === "OCUPADA" ? " rf-availability-upcoming" : ""}`}>
              <div><strong>{viviendaHabitacion?.nombre ?? "Vivienda"} · {habitacion.codigo}</strong><span>{habitacion.estado === "LIBRE" ? "Libre" : "Salida prevista"}</span></div>
              <p><strong>{textoDisponibilidad(habitacion, hoy)}</strong></p>
              <p>Alquiler: {Number(habitacion.precio).toLocaleString("es-ES", { style: "currency", currency: "EUR" })} · Gastos: {Number(habitacion.gastos).toLocaleString("es-ES", { style: "currency", currency: "EUR" })} por persona</p>
              <Link href={`/habitaciones/${habitacion.id}`}>Ver habitación</Link>
            </article>;
          })}
        </div> : <p className="rf-availability-empty">No hay habitaciones libres ni salidas previstas. Puedes registrar un aviso de salida desde la ficha de una habitación.</p>}
      </section>
    </div>
  );
}
