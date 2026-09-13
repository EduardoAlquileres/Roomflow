"use client";

import { useState } from "react";
import { supabase } from "#roomflow-supabase";
import { Cobro } from "@/types/cobro";

export default function EditarCobroModal({ cobro, onCerrar, onGuardado }: {
  cobro: Cobro; onCerrar: () => void; onGuardado: () => Promise<void>;
}) {
  const [alquiler, setAlquiler] = useState(String(cobro.alquiler));
  const [gastos, setGastos] = useState(String(cobro.gastos));
  const [observaciones, setObservaciones] = useState(cobro.observaciones ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const renta = Number(alquiler.replace(",", "."));
  const suministros = Number(gastos.replace(",", "."));
  const valido = alquiler.trim() !== "" && gastos.trim() !== "" && Number.isFinite(renta) && Number.isFinite(suministros) && renta >= 0 && suministros >= 0;
  const total = Math.round((renta + suministros) * 100) / 100;
  const pendiente = Math.max(0, Math.round((total - Number(cobro.pagado)) * 100) / 100);
  const euros = (importe: number) => importe.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

  async function guardar(event: React.FormEvent) {
    event.preventDefault();
    if (!valido || guardando) return;
    setGuardando(true);
    setError("");
    try {
      const estado = pendiente === 0 ? "PAGADO" : cobro.estado === "DEUDA" ? "DEUDA" : Number(cobro.pagado) > 0 ? "PARCIAL" : "PENDIENTE";
      const { data, error: fallo } = await supabase.from("cobros").update({
        alquiler: Math.round(renta * 100) / 100, gastos: Math.round(suministros * 100) / 100,
        total, pendiente, estado, observaciones: observaciones.trim() || null,
      }).eq("id", cobro.id).eq("total", cobro.total).eq("pagado", cobro.pagado).eq("estado", cobro.estado).select("id");
      if (fallo) throw fallo;
      if (!data?.length) throw new Error("El cobro ha cambiado. Cierra esta ventana y recarga la página antes de editarlo.");
      await onGuardado();
      onCerrar();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo guardar el cobro. Inténtalo de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
    <form onSubmit={guardar} role="dialog" aria-modal="true" aria-labelledby="editar-cobro-titulo" className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-2xl">
      <h2 id="editar-cobro-titulo" className="text-xl font-bold">Editar cobro</h2>
      <p className="text-sm text-slate-600">Periodo {cobro.periodo_mes}/{cobro.periodo_anio}. Los pagos registrados se conservan.</p>
      <label className="block text-sm font-medium">Alquiler (€)<input required type="number" min="0" step="0.01" value={alquiler} onChange={e => setAlquiler(e.target.value)} disabled={guardando} className="mt-1 w-full rounded-lg border p-2" /></label>
      <label className="block text-sm font-medium">Gastos (€)<input required type="number" min="0" step="0.01" value={gastos} onChange={e => setGastos(e.target.value)} disabled={guardando} className="mt-1 w-full rounded-lg border p-2" /></label>
      <label className="block text-sm font-medium">Observaciones<textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} disabled={guardando} rows={3} className="mt-1 w-full rounded-lg border p-2" /></label>
      {valido && <div className="rounded-lg bg-slate-50 p-3 text-sm"><p>Total: {euros(total)}</p><p>Pagado: {euros(Number(cobro.pagado))}</p><p className="font-semibold">Pendiente: {euros(pendiente)}</p>{total < Number(cobro.pagado) && <p>Importe pagado de más: {euros(Number(cobro.pagado) - total)}. Este ajuste no realiza ninguna devolución.</p>}</div>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-3"><button type="button" onClick={onCerrar} disabled={guardando} className="rounded-lg border px-4 py-2">Cancelar</button><button type="submit" disabled={guardando || !valido} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{guardando ? "Guardando..." : "Guardar cambios"}</button></div>
    </form>
  </div>;
}
