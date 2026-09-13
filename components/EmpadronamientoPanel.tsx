"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "#roomflow-supabase";
import { Inquilino, Vivienda } from "@/types";

export default function EmpadronamientoPanel({ inquilino, vivienda }: { inquilino: Inquilino; vivienda?: Vivienda }) {
  const router = useRouter();
  const inicial = vivienda && inquilino.empadronamiento_vivienda_id === vivienda.id && typeof inquilino.empadronado === "boolean" ? String(inquilino.empadronado) : "";
  const [estado, setEstado] = useState(inicial);
  const [guardado, setGuardado] = useState(inicial);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  async function guardar() {
    if (!vivienda || guardando) return;
    setGuardando(true); setError(""); setMensaje("");
    try {
      const { data, error: fallo } = await supabase.from("inquilinos").update({
        empadronado: estado === "" ? null : estado === "true",
        empadronamiento_vivienda_id: estado === "" ? null : vivienda.id,
      }).eq("id", inquilino.id).eq("habitacion_id", inquilino.habitacion_id).select("id");
      if (fallo) throw new Error(fallo.message);
      if (!data?.length) throw new Error("La habitación del inquilino ha cambiado. Recarga la ficha antes de guardar.");
      setGuardado(estado); setMensaje("Empadronamiento guardado."); router.refresh();
    } catch (fallo) { setError(fallo instanceof Error ? fallo.message : "No se pudo guardar el empadronamiento."); }
    finally { setGuardando(false); }
  }
  return <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
    <h2 className="text-lg font-bold text-slate-900">Empadronamiento</h2>
    <p className="mt-1 text-sm text-slate-500">{vivienda ? `Vivienda: ${vivienda.nombre}` : "El inquilino no tiene una vivienda asociada."}</p>
    <div className="mt-4 flex flex-wrap items-end gap-3">
      <label className="block text-sm font-medium text-slate-700">¿Está empadronado en esta vivienda?
        <select value={estado} disabled={!vivienda || guardando} onChange={e => { setEstado(e.target.value); setMensaje(""); setError(""); }} className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900">
          <option value="">Sin indicar</option><option value="true">Sí</option><option value="false">No</option>
        </select>
      </label>
      <button type="button" onClick={guardar} disabled={!vivienda || guardando || estado === guardado} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{guardando ? "Guardando..." : "Guardar empadronamiento"}</button>
    </div>
    {mensaje && <p role="status" className="mt-3 text-sm text-green-700">{mensaje}</p>}
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  </section>;
}
