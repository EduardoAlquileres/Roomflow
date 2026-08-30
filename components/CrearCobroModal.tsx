"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { EstanciaEconomica, estanciaParaPeriodo, fechaVencimientoPeriodo, importesCobroPeriodo, personasEnHabitacionPeriodo } from "@/lib/estanciasCobros";

export type HabitacionParaCobro = {
  id: string; codigo: string; vivienda_id: string; precio: number; gastos: number; estado: "LIBRE" | "OCUPADA" | "RESERVADA";
};
export type InquilinoParaCobro = { id: string; habitacion_id: string; nombre: string; apellidos: string; activo: boolean };
export type ViviendaParaCobro = { id: string; nombre: string };
export type DatosNuevoCobro = {
  habitacionId: string; inquilinoId: string; periodoMes: number; periodoAnio: number;
  alquiler: number; gastos: number; fechaVencimiento: string; observaciones: string;
};

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function CrearCobroModal({ habitaciones, viviendas, inquilinos, estancias, guardando = false, onCerrar, onGuardar }: {
  habitaciones: HabitacionParaCobro[]; viviendas: ViviendaParaCobro[]; inquilinos: InquilinoParaCobro[]; estancias: EstanciaEconomica[]; guardando?: boolean;
  onCerrar: () => void; onGuardar: (datos: DatosNuevoCobro) => Promise<void>;
}) {
  const disponibles = useMemo(() => habitaciones.filter((habitacion) => inquilinos.some((inquilino) => inquilino.activo && inquilino.habitacion_id === habitacion.id)), [habitaciones, inquilinos]);
  const inicial = disponibles[0];
  const hoy = new Date();
  const importesReales = (habitacionId: string, periodoMes: number, periodoAnio: number) => {
    const titular = inquilinos.find((item) => item.activo && item.habitacion_id === habitacionId);
    const estancia = titular ? estanciaParaPeriodo(estancias, titular.id, periodoAnio, periodoMes) : null;
    if (!estancia) {
      const habitacion = habitaciones.find((item) => item.id === habitacionId);
      return { alquiler: Number(habitacion?.precio ?? 0), gastos: Number(habitacion?.gastos ?? 0) };
    }
    const hoyPeriodo = new Date();
    const claveSeleccionada = periodoAnio * 100 + periodoMes;
    const claveActual = hoyPeriodo.getFullYear() * 100 + hoyPeriodo.getMonth() + 1;
    const personasHistoricas = personasEnHabitacionPeriodo(estancias, habitacionId, periodoAnio, periodoMes, estancia.fecha_entrada);
    const personasActivas = inquilinos.filter((item) => item.activo && item.habitacion_id === habitacionId).length;
    const personas = Math.max(1, claveSeleccionada >= claveActual ? personasActivas : personasHistoricas);
    return { ...importesCobroPeriodo(estancia, personas, periodoAnio, periodoMes), personas, gastosPorPersona: Number(estancia.gastos) };
  };
  const importesIniciales = inicial ? importesReales(inicial.id, hoy.getMonth() + 1, hoy.getFullYear()) : null;
  const [habitacionId, setHabitacionId] = useState(inicial?.id ?? "");
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [alquiler, setAlquiler] = useState(String(importesIniciales?.alquiler ?? ""));
  const [gastos, setGastos] = useState(String(importesIniciales?.gastos ?? ""));
  const [vencimiento, setVencimiento] = useState(fechaVencimientoPeriodo(hoy.getFullYear(), hoy.getMonth() + 1));
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState("");
  const inquilino = inquilinos.find((item) => item.activo && item.habitacion_id === habitacionId);
  const detalleGastos = importesReales(habitacionId, mes, anio);

  function actualizarImportes(id: string, periodoMes: number, periodoAnio: number) {
    const importes = importesReales(id, periodoMes, periodoAnio);
    setAlquiler(String(importes.alquiler));
    setGastos(String(importes.gastos));
  }

  function seleccionarHabitacion(id: string) {
    setHabitacionId(id);
    actualizarImportes(id, mes, anio);
  }

  function seleccionarMes(nuevoMes: number) {
    setMes(nuevoMes);
    setVencimiento(fechaVencimientoPeriodo(anio, nuevoMes));
    actualizarImportes(habitacionId, nuevoMes, anio);
  }

  function seleccionarAnio(nuevoAnio: number) {
    setAnio(nuevoAnio);
    setVencimiento(fechaVencimientoPeriodo(nuevoAnio, mes));
    actualizarImportes(habitacionId, mes, nuevoAnio);
  }

  async function guardar() {
    const alquilerNumero = Number(alquiler.replace(",", "."));
    const gastosNumero = Number(gastos.replace(",", "."));
    if (!inquilino || !Number.isFinite(alquilerNumero) || alquilerNumero < 0 || !Number.isFinite(gastosNumero) || gastosNumero < 0) {
      setError("Selecciona una habitación e introduce importes válidos."); return;
    }
    await onGuardar({ habitacionId, inquilinoId: inquilino.id, periodoMes: mes, periodoAnio: anio, alquiler: alquilerNumero, gastos: gastosNumero, fechaVencimiento: vencimiento, observaciones });
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
    <div className="w-full max-w-xl rounded-xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b p-5"><div><h2 className="text-xl font-bold">Nuevo cobro</h2><p className="mt-1 text-sm text-slate-500">Crea el cobro mensual de una habitación con inquilino activo.</p></div><button type="button" onClick={onCerrar} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Cerrar"><X size={20} /></button></div>
      <div className="space-y-4 p-5">
        {disponibles.length === 0 ? <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">No hay habitaciones ocupadas con un inquilino activo.</p> : <>
          <label className="block text-sm font-medium">Habitación<select value={habitacionId} onChange={(event) => seleccionarHabitacion(event.target.value)} className="mt-1 w-full rounded-lg border p-2.5">{disponibles.map((item) => { const vivienda = viviendas.find((value) => value.id === item.vivienda_id); const ocupante = inquilinos.find((value) => value.activo && value.habitacion_id === item.id); return <option key={item.id} value={item.id}>{vivienda?.nombre ?? "Sin vivienda"} · {item.codigo} — {ocupante?.nombre} {ocupante?.apellidos}</option>; })}</select></label>
          <div className="grid grid-cols-2 gap-4"><label className="block text-sm font-medium">Mes<select value={mes} onChange={(event) => seleccionarMes(Number(event.target.value))} className="mt-1 w-full rounded-lg border p-2.5">{MESES.map((nombre, indice) => <option key={nombre} value={indice + 1}>{nombre}</option>)}</select></label><label className="block text-sm font-medium">Año<input type="number" min="2020" value={anio} onChange={(event) => seleccionarAnio(Number(event.target.value))} className="mt-1 w-full rounded-lg border p-2.5" /></label></div>
          <div className="grid grid-cols-2 gap-4"><label className="block text-sm font-medium">Alquiler (€)<input inputMode="decimal" value={alquiler} onChange={(event) => setAlquiler(event.target.value)} className="mt-1 w-full rounded-lg border p-2.5" /></label><label className="block text-sm font-medium">Gastos totales (€)<input inputMode="decimal" value={gastos} onChange={(event) => setGastos(event.target.value)} className="mt-1 w-full rounded-lg border p-2.5" />{"personas" in detalleGastos && detalleGastos.personas > 1 && <span className="mt-1 block text-xs font-normal text-slate-500">{detalleGastos.personas} personas × {detalleGastos.gastosPorPersona.toLocaleString("es-ES", { minimumFractionDigits: 2 })} € por persona</span>}</label></div>
          <label className="block text-sm font-medium">Fecha de vencimiento<input type="date" value={vencimiento} onChange={(event) => setVencimiento(event.target.value)} className="mt-1 w-full rounded-lg border p-2.5" /></label><label className="block text-sm font-medium">Observaciones<textarea rows={3} value={observaciones} onChange={(event) => setObservaciones(event.target.value)} className="mt-1 w-full rounded-lg border p-2.5" /></label>
        </>}
        {error && <p className="text-sm text-red-700">{error}</p>}
      </div>
      <div className="flex justify-end gap-3 border-t p-5"><button type="button" onClick={onCerrar} disabled={guardando} className="rounded-lg border px-4 py-2 font-medium">Cancelar</button><button type="button" onClick={guardar} disabled={guardando || disponibles.length === 0} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{guardando ? "Creando..." : "Crear cobro"}</button></div>
    </div>
  </div>;
}
