"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, CheckCircle2, Pencil, Plus, X } from "lucide-react";
import { CuotaFianza } from "@/types";
import { supabase } from "@/lib/supabase";

const moneda = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const errorTexto = (error: unknown, defecto: string) => typeof error === "object" && error !== null && "message" in error && typeof error.message === "string" ? error.message : error instanceof Error ? error.message : defecto;
const numero = (valor: string | number) => Number(String(valor).replace(",", ".")) || 0;

type Props = {
  fianzaId: string;
  estanciaId: string;
  importeTotal: number;
  entregado: number;
  fechaCobro: string;
  cuotas: CuotaFianza[];
};

export default function FianzaCuotasPanel({ fianzaId, estanciaId, importeTotal, entregado, fechaCobro, cuotas: iniciales }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [cuotas, setCuotas] = useState(iniciales);
  const [importePactado, setImportePactado] = useState(String(importeTotal));
  const [cuotasEliminadas, setCuotasEliminadas] = useState<string[]>([]);
  const [pagos, setPagos] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const router = useRouter();
  const totalPactado = numero(importePactado);
  const sumaPlan = cuotas.reduce((suma, cuota) => suma + Number(cuota.importe), 0);
  const pendiente = cuotas.reduce((suma, cuota) => suma + Math.max(Number(cuota.importe) - Number(cuota.importe_pagado), 0), 0);

  function anadirCuota() {
    const falta = Number((totalPactado - sumaPlan).toFixed(2));
    if (falta <= 0) {
      alert("Primero reduce o reparte alguna cuota pendiente para dejar importe disponible.");
      return;
    }
    const ultima = cuotas.reduce((actual, cuota) => cuota.fecha_prevista > actual.fecha_prevista ? cuota : actual, cuotas[0]);
    const fecha = new Date(`${ultima.fecha_prevista}T12:00:00`);
    fecha.setMonth(fecha.getMonth() + 1);
    setCuotas((actual) => [...actual, {
      id: crypto.randomUUID(), fianza_id: fianzaId,
      numero: Math.max(...actual.map((cuota) => cuota.numero)) + 1,
      fecha_prevista: fecha.toISOString().slice(0, 10), importe: falta,
      importe_pagado: 0, fecha_pago: null, estado: "PENDIENTE", observaciones: null,
    }]);
  }

  function dejarEnImporteEntregado() {
    if (entregado <= 0) {
      alert("Primero registra la cantidad que se ha entregado.");
      return;
    }
    const eliminadas = cuotas.filter((cuota) => Number(cuota.importe_pagado) <= 0).map((cuota) => cuota.id);
    setCuotasEliminadas((actual) => [...new Set([...actual, ...eliminadas])]);
    setCuotas((actual) => actual
      .filter((cuota) => Number(cuota.importe_pagado) > 0)
      .map((cuota) => ({ ...cuota, importe: Number(cuota.importe_pagado), estado: "PAGADA" as const }))
    );
    setImportePactado(String(entregado));
  }

  async function guardarPlan() {
    if (!Number.isFinite(totalPactado) || totalPactado < 0) {
      alert("Indica una fianza pactada válida.");
      return;
    }
    if (totalPactado < entregado - 0.01) {
      alert("La fianza pactada no puede ser inferior a lo ya entregado.");
      return;
    }
    if (Math.abs(sumaPlan - totalPactado) > 0.01) {
      alert(`El plan debe sumar exactamente ${moneda.format(totalPactado)}. Falta repartir ${moneda.format(Math.max(totalPactado - sumaPlan, 0))}.`);
      return;
    }
    if (cuotas.some((cuota) => Number(cuota.importe) < Number(cuota.importe_pagado))) {
      alert("Una cuota no puede ser inferior a lo ya entregado.");
      return;
    }
    setGuardando(true);
    try {
      const { error: errorFianza } = await supabase.from("fianzas").update({ importe: totalPactado }).eq("id", fianzaId);
      if (errorFianza) throw errorFianza;
      const { error: errorEstancia } = await supabase.from("estancias").update({ fianza: totalPactado }).eq("id", estanciaId);
      if (errorEstancia) throw errorEstancia;
      const { error: errorCuotas } = await supabase.from("fianza_cuotas").upsert(cuotas.map((cuota) => ({
        id: cuota.id, fianza_id: cuota.fianza_id, numero: cuota.numero, fecha_prevista: cuota.fecha_prevista,
        importe: Number(cuota.importe), importe_pagado: Number(cuota.importe_pagado), fecha_pago: cuota.fecha_pago, estado: cuota.estado,
      })));
      if (errorCuotas) throw errorCuotas;
      if (cuotasEliminadas.length) {
        const { error } = await supabase.from("fianza_cuotas").delete().in("id", cuotasEliminadas);
        if (error) throw error;
      }
      setCuotasEliminadas([]);
      router.refresh();
    } catch (error) {
      alert(errorTexto(error, "No se pudo guardar el plan."));
    } finally {
      setGuardando(false);
    }
  }

  async function registrarPago(cuota: CuotaFianza) {
    const importePago = numero(pagos[cuota.id] ?? "");
    const restante = Math.max(Number(cuota.importe) - Number(cuota.importe_pagado), 0);
    if (!importePago || importePago <= 0 || importePago > restante) {
      alert(`Indica un importe entre 0,01 € y ${moneda.format(restante)}.`);
      return;
    }
    setGuardando(true);
    try {
      const nuevoPagado = Number(cuota.importe_pagado) + importePago;
      const { error: errorCuota } = await supabase.from("fianza_cuotas").update({
        importe_pagado: nuevoPagado, fecha_pago: new Date().toISOString().slice(0, 10),
        estado: nuevoPagado >= Number(cuota.importe) - 0.005 ? "PAGADA" : "PENDIENTE",
      }).eq("id", cuota.id);
      if (errorCuota) throw errorCuota;
      const { error: errorFianza } = await supabase.from("fianzas").update({ importe_entregado: Number(entregado) + importePago }).eq("id", fianzaId);
      if (errorFianza) throw errorFianza;
      router.refresh();
    } catch (error) {
      alert(errorTexto(error, "No se pudo registrar la entrega."));
    } finally {
      setGuardando(false);
    }
  }

  async function crearPlanInicial() {
    setGuardando(true);
    try {
      const { data: existente, error: errorExistente } = await supabase.from("fianza_cuotas").select("id").eq("fianza_id", fianzaId).limit(1);
      if (errorExistente) throw errorExistente;
      if (existente?.length) { router.refresh(); return; }
      const inicio = new Date(`${fechaCobro.slice(0, 10)}T12:00:00`);
      const resto = Math.max(importeTotal - entregado, 0);
      const cuota = Number((resto / 2).toFixed(2));
      const filas: Array<Record<string, unknown>> = entregado > 0 ? [{ fianza_id: fianzaId, numero: 1, fecha_prevista: fechaCobro.slice(0, 10), importe: entregado, importe_pagado: entregado, fecha_pago: fechaCobro.slice(0, 10), estado: "PAGADA" }] : [];
      for (let indice = 0; indice < (resto > 0 ? 2 : 0); indice += 1) {
        const fecha = new Date(inicio);
        fecha.setMonth(fecha.getMonth() + indice + 1);
        filas.push({ fianza_id: fianzaId, numero: filas.length + 1, fecha_prevista: fecha.toISOString().slice(0, 10), importe: indice === 1 ? Number((resto - cuota).toFixed(2)) : cuota, importe_pagado: 0, fecha_pago: null, estado: "PENDIENTE" });
      }
      const { error } = await supabase.from("fianza_cuotas").insert(filas);
      if (error) throw error;
      router.refresh();
    } catch (error) {
      alert(errorTexto(error, "No se pudo crear el plan."));
    } finally {
      setGuardando(false);
    }
  }

  if (cuotas.length === 0) return <button type="button" disabled={guardando} onClick={crearPlanInicial} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 disabled:opacity-50">Crear plan de cuotas</button>;

  return <>
    <button type="button" onClick={() => setAbierto(true)} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700"><CalendarClock size={16} /> Gestionar pagos</button>
    {abierto && <div className="fixed inset-0 z-50 flex items-end bg-slate-950/40 p-0 sm:items-center sm:justify-center sm:p-6">
      <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-bold text-slate-900">Plan de pago de la fianza</h3><p className="mt-1 text-sm text-slate-500">Entregado: {moneda.format(entregado)} · Pendiente según plan: {moneda.format(pendiente)}</p></div><button onClick={() => setAbierto(false)} className="rounded-lg p-2 text-slate-500"><X size={20} /></button></div>
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4"><label className="block text-sm font-semibold text-slate-800">Fianza pactada (€)<input inputMode="decimal" value={importePactado} onChange={(event) => setImportePactado(event.target.value)} className="mt-1 w-full rounded-lg border border-amber-200 bg-white p-2" /></label><p className="mt-2 text-xs text-slate-600">Puede ser distinta de los meses establecidos para la habitación cuando haya una condición especial.</p>{entregado > 0 && <button type="button" onClick={dejarEnImporteEntregado} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-800"><CheckCircle2 size={16} /> Dejar la fianza en {moneda.format(entregado)}</button>}</div>
        <div className="mt-5 space-y-3">{cuotas.map((cuota) => { const restante = Math.max(Number(cuota.importe) - Number(cuota.importe_pagado), 0); return <article key={cuota.id} className="rounded-xl border border-slate-200 p-3"><div className="grid gap-3 sm:grid-cols-[1fr_130px_130px]"><label className="text-xs font-semibold text-slate-500">Fecha prevista<input type="date" disabled={cuota.estado === "PAGADA"} value={cuota.fecha_prevista} onChange={(event) => setCuotas((actual) => actual.map((item) => item.id === cuota.id ? { ...item, fecha_prevista: event.target.value } : item))} className="mt-1 w-full rounded-lg border p-2 text-sm disabled:bg-slate-100" /></label><label className="text-xs font-semibold text-slate-500">Importe pactado<input type="number" min={cuota.importe_pagado} step="0.01" disabled={cuota.estado === "PAGADA"} value={cuota.importe} onChange={(event) => setCuotas((actual) => actual.map((item) => item.id === cuota.id ? { ...item, importe: Number(event.target.value) } : item))} className="mt-1 w-full rounded-lg border p-2 text-sm disabled:bg-slate-100" /></label><div className="text-xs font-semibold text-slate-500">Estado<p className={`mt-2 text-sm ${cuota.estado === "PAGADA" ? "text-emerald-700" : "text-blue-700"}`}>{cuota.estado === "PAGADA" ? "Pagada" : `Pendiente ${moneda.format(restante)}`}</p></div></div>{cuota.estado !== "PAGADA" && <div className="mt-3 flex gap-2"><input inputMode="decimal" placeholder="Importe recibido" value={pagos[cuota.id] ?? ""} onChange={(event) => setPagos((actual) => ({ ...actual, [cuota.id]: event.target.value }))} className="min-w-0 flex-1 rounded-lg border p-2 text-sm" /><button disabled={guardando} onClick={() => registrarPago(cuota)} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Registrar</button></div>}</article>; })}</div>
        <div className="mt-5 flex flex-wrap justify-between gap-3 border-t pt-4"><button type="button" onClick={anadirCuota} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"><Plus size={16} /> Añadir cuota</button><div className="flex gap-3"><button onClick={() => setAbierto(false)} className="rounded-lg border px-4 py-2 text-sm font-medium">Cerrar</button><button disabled={guardando} onClick={guardarPlan} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Pencil size={16} /> Guardar plan</button></div></div>
      </section>
    </div>}
  </>;
}
