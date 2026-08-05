"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Pencil, X } from "lucide-react";
import { CuotaFianza } from "@/types";
import { supabase } from "@/lib/supabase";

const moneda = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

export default function FianzaCuotasPanel({ fianzaId, importeTotal, entregado, fechaCobro, cuotas: iniciales }: { fianzaId: string; importeTotal: number; entregado: number; fechaCobro: string; cuotas: CuotaFianza[] }) {
  const [abierto, setAbierto] = useState(false);
  const [cuotas, setCuotas] = useState(iniciales);
  const [pagos, setPagos] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const router = useRouter();
  const pendiente = cuotas.reduce((suma, cuota) => suma + Math.max(Number(cuota.importe) - Number(cuota.importe_pagado), 0), 0);

  async function guardarPlan() {
    const totalPlan = cuotas.reduce((suma, cuota) => suma + Number(cuota.importe), 0);
    if (Math.abs(totalPlan - importeTotal) > 0.01) { alert(`El plan debe sumar exactamente ${moneda.format(importeTotal)}.`); return; }
    if (cuotas.some((cuota) => Number(cuota.importe) < Number(cuota.importe_pagado))) { alert("Una cuota no puede ser inferior a lo ya entregado."); return; }
    setGuardando(true);
    try {
      const { error } = await supabase.from("fianza_cuotas").upsert(cuotas.map((cuota) => ({ id: cuota.id, fianza_id: cuota.fianza_id, numero: cuota.numero, fecha_prevista: cuota.fecha_prevista, importe: Number(cuota.importe), importe_pagado: Number(cuota.importe_pagado), fecha_pago: cuota.fecha_pago, estado: cuota.estado })));
      if (error) throw error;
      router.refresh();
    } catch (error) { alert(error instanceof Error ? error.message : "No se pudo guardar el plan."); } finally { setGuardando(false); }
  }

  async function registrarPago(cuota: CuotaFianza) {
    const importePago = Number((pagos[cuota.id] ?? "").replace(",", "."));
    const restante = Math.max(Number(cuota.importe) - Number(cuota.importe_pagado), 0);
    if (!importePago || importePago <= 0 || importePago > restante) { alert(`Indica un importe entre 0,01 € y ${moneda.format(restante)}.`); return; }
    setGuardando(true);
    try {
      const nuevoPagado = Number(cuota.importe_pagado) + importePago;
      const pagada = nuevoPagado >= Number(cuota.importe) - 0.005;
      const { error: errorCuota } = await supabase.from("fianza_cuotas").update({ importe_pagado: nuevoPagado, fecha_pago: new Date().toISOString().slice(0, 10), estado: pagada ? "PAGADA" : "PENDIENTE" }).eq("id", cuota.id);
      if (errorCuota) throw errorCuota;
      const { error: errorFianza } = await supabase.from("fianzas").update({ importe_entregado: Number(entregado) + importePago }).eq("id", fianzaId);
      if (errorFianza) throw errorFianza;
      router.refresh();
    } catch (error) { alert(error instanceof Error ? error.message : "No se pudo registrar la entrega."); } finally { setGuardando(false); }
  }

  async function crearPlanInicial() {
    setGuardando(true);
    try {
      const fechaInicio = new Date(`${fechaCobro.slice(0, 10)}T12:00:00`);
      const pendienteInicial = Math.max(importeTotal - entregado, 0);
      const partes = pendienteInicial > 0 ? 2 : 0;
      const importePorParte = partes ? Number((pendienteInicial / partes).toFixed(2)) : 0;
      const nuevasCuotas: Array<Record<string, unknown>> = [];
      if (entregado > 0) nuevasCuotas.push({ fianza_id: fianzaId, numero: 1, fecha_prevista: fechaCobro.slice(0, 10), importe: entregado, importe_pagado: entregado, fecha_pago: fechaCobro.slice(0, 10), estado: "PAGADA" });
      for (let indice = 0; indice < partes; indice += 1) {
        const fecha = new Date(fechaInicio);
        fecha.setMonth(fecha.getMonth() + indice + 1);
        const importe = indice === partes - 1 ? Number((pendienteInicial - importePorParte * (partes - 1)).toFixed(2)) : importePorParte;
        nuevasCuotas.push({ fianza_id: fianzaId, numero: nuevasCuotas.length + 1, fecha_prevista: fecha.toISOString().slice(0, 10), importe, importe_pagado: 0, fecha_pago: null, estado: "PENDIENTE" });
      }
      const { error } = await supabase.from("fianza_cuotas").insert(nuevasCuotas);
      if (error) throw error;
      router.refresh();
    } catch (error) { alert(typeof error === "object" && error !== null && "message" in error && typeof error.message === "string" ? error.message : error instanceof Error ? error.message : "No se pudo crear el plan."); } finally { setGuardando(false); }
  }

  if (cuotas.length === 0) return <button type="button" disabled={guardando} onClick={crearPlanInicial} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 disabled:opacity-50">Crear plan de cuotas</button>;
  return <><button type="button" onClick={() => setAbierto(true)} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700"><CalendarClock size={16} /> Gestionar pagos</button>{abierto && <div className="fixed inset-0 z-50 flex items-end bg-slate-950/40 p-0 sm:items-center sm:justify-center sm:p-6"><section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"><div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-bold text-slate-900">Plan de pago de la fianza</h3><p className="mt-1 text-sm text-slate-500">Entregado: {moneda.format(entregado)} · Pendiente según plan: {moneda.format(pendiente)}</p></div><button onClick={() => setAbierto(false)} className="rounded-lg p-2 text-slate-500"><X size={20} /></button></div><div className="mt-5 space-y-3">{cuotas.map((cuota, indice) => { const restante = Math.max(Number(cuota.importe) - Number(cuota.importe_pagado), 0); return <article key={cuota.id} className="rounded-xl border border-slate-200 p-3"><div className="grid gap-3 sm:grid-cols-[1fr_130px_130px]"><label className="text-xs font-semibold text-slate-500">Fecha prevista<input type="date" disabled={cuota.estado === "PAGADA"} value={cuota.fecha_prevista} onChange={(event) => setCuotas((actual) => actual.map((item) => item.id === cuota.id ? { ...item, fecha_prevista: event.target.value } : item))} className="mt-1 w-full rounded-lg border p-2 text-sm disabled:bg-slate-100" /></label><label className="text-xs font-semibold text-slate-500">Importe pactado<input type="number" min={cuota.importe_pagado} step="0.01" disabled={cuota.estado === "PAGADA"} value={cuota.importe} onChange={(event) => setCuotas((actual) => actual.map((item) => item.id === cuota.id ? { ...item, importe: Number(event.target.value) } : item))} className="mt-1 w-full rounded-lg border p-2 text-sm disabled:bg-slate-100" /></label><div className="text-xs font-semibold text-slate-500">Estado<p className={`mt-2 text-sm ${cuota.estado === "PAGADA" ? "text-emerald-700" : "text-blue-700"}`}>{cuota.estado === "PAGADA" ? "Pagada" : `Pendiente ${moneda.format(restante)}`}</p></div></div>{cuota.estado !== "PAGADA" && <div className="mt-3 flex gap-2"><input inputMode="decimal" placeholder="Entrega recibida" value={pagos[cuota.id] ?? ""} onChange={(event) => setPagos((actual) => ({ ...actual, [cuota.id]: event.target.value }))} className="min-w-0 flex-1 rounded-lg border p-2 text-sm" /><button disabled={guardando} onClick={() => registrarPago(cuota)} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Registrar</button></div>}</article>; })}</div><div className="mt-5 flex justify-end gap-3 border-t pt-4"><button onClick={() => setAbierto(false)} className="rounded-lg border px-4 py-2 text-sm font-medium">Cerrar</button><button disabled={guardando} onClick={guardarPlan} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Pencil size={16} /> Guardar plan</button></div></section></div>}</>;
}
