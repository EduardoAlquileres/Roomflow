"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { actualizarInquilino } from "@/lib/inquilinos";
import { actualizarEstancia, crearEstancia, obtenerEstanciaActivaPorInquilino } from "@/lib/estancias";

type Props = {
  inquilinoId: string;
  habitacionId: string;
  fechaEntrada: string;
  observaciones: string | null;
  precio: number;
  gastos: number;
};

function mensajeError(error: unknown, alternativa: string) {
  if (typeof error === "object" && error && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return alternativa;
}

export default function EditarCheckInForm({ inquilinoId, habitacionId, fechaEntrada: fechaInicial, observaciones: observacionesIniciales, precio, gastos }: Props) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [fechaEntrada, setFechaEntrada] = useState(fechaInicial);
  const [fianza, setFianza] = useState("0");
  const [observaciones, setObservaciones] = useState(observacionesIniciales ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function abrirFormulario() {
    try {
      const estancia = await obtenerEstanciaActivaPorInquilino(inquilinoId);
      if (estancia) {
        setFechaEntrada(estancia.fecha_entrada);
        setFianza(String(estancia.fianza));
        setObservaciones(estancia.observaciones ?? observacionesIniciales ?? "");
      }
      setAbierto(true);
    } catch (error) {
      setError(mensajeError(error, "No se pudo cargar el check-in."));
    }
  }

  async function guardar() {
    if (!fechaEntrada) { setError("Indica una fecha de entrada."); return; }
    setGuardando(true); setError("");
    try {
      const estancia = await obtenerEstanciaActivaPorInquilino(inquilinoId);
      await actualizarInquilino(inquilinoId, { fecha_entrada: fechaEntrada, observaciones: observaciones.trim() || null });
      const importeFianza = Number(fianza.replace(",", ".")) || 0;
      if (estancia) {
        await actualizarEstancia(estancia.id, { fecha_entrada: fechaEntrada, fianza: importeFianza, observaciones: observaciones.trim() || null });
      } else {
        await crearEstancia({ inquilino_id: inquilinoId, habitacion_id: habitacionId, fecha_entrada: fechaEntrada, fecha_salida: null, precio, gastos, fianza: importeFianza, estado: "ACTIVA", observaciones: observaciones.trim() || null });
      }
      setAbierto(false);
      router.refresh();
    } catch (error) {
      setError(mensajeError(error, "No se pudo actualizar el check-in."));
    } finally { setGuardando(false); }
  }

  if (!abierto) return <button type="button" onClick={abrirFormulario} className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">Editar Check-In</button>;
  return <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4"><h3 className="font-semibold text-slate-900">Corregir Check-In</h3><p className="mt-1 text-sm text-slate-600">La fecha se actualizará en la ficha y en el historial. Los cobros ya emitidos no cambian.</p><div className="mt-4 grid gap-4 md:grid-cols-2"><label className="text-sm font-medium text-slate-700">Fecha de entrada<input type="date" value={fechaEntrada} onChange={(event) => setFechaEntrada(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2" /></label><label className="text-sm font-medium text-slate-700">Fianza (EUR)<input type="text" inputMode="decimal" value={fianza} onChange={(event) => setFianza(event.target.value)} placeholder="Ej.: 1200" className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2" /></label></div><label className="mt-4 block text-sm font-medium text-slate-700">Observaciones<textarea value={observaciones} onChange={(event) => setObservaciones(event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2" /></label>{error && <p className="mt-3 text-sm text-red-700">{error}</p>}<div className="mt-4 flex justify-end gap-3"><button type="button" onClick={() => { setAbierto(false); setError(""); }} className="rounded-lg border bg-white px-4 py-2 text-sm font-medium">Cancelar</button><button type="button" disabled={guardando} onClick={guardar} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{guardando ? "Guardando..." : "Guardar corrección"}</button></div></div>;
}
