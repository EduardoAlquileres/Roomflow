"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, DoorOpen, Home, Users } from "lucide-react";

type Inquilino = {
  id: string;
  habitacion_id: string;
  nombre: string;
  apellidos: string;
  telefono: string;
  email: string;
  fecha_entrada: string;
  fecha_salida: string | null;
  activo: boolean;
};

type Habitacion = { id: string; codigo: string; vivienda_id: string };
type Vivienda = { id: string; nombre: string };

type Props = { inquilinos: Inquilino[]; habitaciones: Habitacion[]; viviendas: Vivienda[] };

function fechaLocal(fecha: string) {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(`${fecha}T00:00:00`));
}

function duracionEstancia(entrada: string, salida: string | null) {
  const inicio = new Date(`${entrada}T00:00:00`);
  const fin = salida ? new Date(`${salida}T00:00:00`) : new Date();
  const dias = Math.max(0, Math.floor((fin.getTime() - inicio.getTime()) / 86_400_000));
  const meses = Math.floor(dias / 30);
  if (meses === 0) return `${dias} ${dias === 1 ? "día" : "días"}`;
  const diasRestantes = dias % 30;
  return diasRestantes === 0 ? `${meses} ${meses === 1 ? "mes" : "meses"}` : `${meses} ${meses === 1 ? "mes" : "meses"} y ${diasRestantes} días`;
}

export default function InquilinosListado({ inquilinos, habitaciones, viviendas }: Props) {
  const [viviendaId, setViviendaId] = useState("");
  const [habitacionId, setHabitacionId] = useState("");

  const habitacionesDisponibles = viviendaId
    ? habitaciones.filter((habitacion) => habitacion.vivienda_id === viviendaId)
    : habitaciones;
  const inquilinosFiltrados = inquilinos.filter((inquilino) => {
    const habitacion = habitaciones.find((item) => item.id === inquilino.habitacion_id);
    if (viviendaId && habitacion?.vivienda_id !== viviendaId) return false;
    if (habitacionId && inquilino.habitacion_id !== habitacionId) return false;
    return true;
  });

  return (
    <section className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
        <div className="flex items-center gap-3"><div className="rounded-lg bg-blue-100 p-2 text-blue-600"><Users size={21} /></div><div><h2 className="font-bold text-slate-900">Todos los inquilinos</h2><p className="text-sm text-slate-500">{inquilinosFiltrados.length} de {inquilinos.length} registros</p></div></div>
      </div>
      <div className="grid gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">Vivienda
          <select value={viviendaId} onChange={(event) => { setViviendaId(event.target.value); setHabitacionId(""); }} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900">
            <option value="">Todas las viviendas</option>
            {viviendas.map((vivienda) => <option key={vivienda.id} value={vivienda.id}>{vivienda.nombre}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">Habitación
          <select value={habitacionId} onChange={(event) => setHabitacionId(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900">
            <option value="">Todas las habitaciones</option>
            {habitacionesDisponibles.map((habitacion) => <option key={habitacion.id} value={habitacion.id}>{habitacion.codigo}</option>)}
          </select>
        </label>
      </div>
      {inquilinosFiltrados.length === 0 ? <div className="p-10 text-center text-slate-500">No hay inquilinos que coincidan con los filtros.</div> : (
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="bg-slate-50 text-sm text-slate-600"><tr><th className="px-5 py-4 font-semibold">Inquilino</th><th className="px-5 py-4 font-semibold">Vivienda</th><th className="px-5 py-4 font-semibold">Habitación</th><th className="px-5 py-4 font-semibold">Entrada</th><th className="px-5 py-4 font-semibold">Tiempo en habitación</th><th className="px-5 py-4 font-semibold">Estado</th><th className="px-5 py-4" /></tr></thead><tbody>{inquilinosFiltrados.map((inquilino) => {
          const habitacion = habitaciones.find((item) => item.id === inquilino.habitacion_id);
          const vivienda = habitacion ? viviendas.find((item) => item.id === habitacion.vivienda_id) : undefined;
          return <tr key={inquilino.id} className="border-t border-slate-100 hover:bg-slate-50"><td className="px-5 py-4"><div className="font-semibold text-slate-900">{inquilino.nombre} {inquilino.apellidos}</div><div className="mt-1 text-sm text-slate-500">{inquilino.telefono || inquilino.email || "Sin contacto"}</div></td><td className="px-5 py-4 text-slate-600"><span className="inline-flex items-center gap-2"><Home size={16} className="text-slate-400" />{vivienda?.nombre ?? "—"}</span></td><td className="px-5 py-4 text-slate-600"><span className="inline-flex items-center gap-2"><DoorOpen size={16} className="text-slate-400" />{habitacion?.codigo ?? "—"}</span></td><td className="px-5 py-4 text-slate-600"><span className="inline-flex items-center gap-2"><CalendarDays size={16} className="text-slate-400" />{fechaLocal(inquilino.fecha_entrada)}</span></td><td className="px-5 py-4 font-medium text-slate-700">{duracionEstancia(inquilino.fecha_entrada, inquilino.fecha_salida)}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${inquilino.activo ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}>{inquilino.activo ? "Activo" : "Finalizado"}</span></td><td className="px-5 py-4 text-right"><Link href={`/inquilinos/${inquilino.id}`} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50">Ver ficha <ChevronRight size={16} /></Link></td></tr>;
        })}</tbody></table></div>
      )}
    </section>
  );
}
