"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { supabase } from "#roomflow-supabase";

export default function AvisoSalidaForm({ habitacionId, fechaInicial }: { habitacionId: string; fechaInicial: string | null }) {
  const router = useRouter();
  const [fecha, setFecha] = useState(fechaInicial?.slice(0, 10) ?? "");
  const [guardada, setGuardada] = useState(fechaInicial?.slice(0, 10) ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const hoy = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });

  async function guardar(valor: string) {
    if (guardando) return;
    setGuardando(true);
    setError("");
    setMensaje("");
    try {
      const { data, error } = await supabase.from("habitaciones")
        .update({ disponible_desde: valor || null }).eq("id", habitacionId).eq("estado", "OCUPADA")
        .select("id").maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("La habitación ya no está ocupada. Actualiza la página.");
      setFecha(valor);
      setGuardada(valor);
      setMensaje(valor ? "Aviso guardado. Ya aparece en Habitaciones disponibles del Dashboard." : "Aviso de salida retirado.");
      router.refresh();
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : "No se pudo guardar el aviso de salida.");
    } finally {
      setGuardando(false);
    }
  }

  function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (fecha) void guardar(fecha);
  }

  return <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
    <h3 className="flex items-center gap-2 font-semibold text-amber-950"><CalendarDays size={18} /> Aviso de salida</h3>
    <p className="mt-2 text-sm text-slate-600">Indica cuándo está previsto que quede libre la habitación. El alquiler seguirá activo hasta confirmar el Check-Out.</p>
    <form onSubmit={enviar} className="mt-3 flex flex-wrap items-end gap-3">
      <label className="text-sm font-medium text-slate-700" htmlFor="salida-prevista">Fecha prevista de salida
        <input id="salida-prevista" type="date" value={fecha} min={hoy} required disabled={guardando} onChange={event => { setFecha(event.target.value); setMensaje(""); }} className="mt-1 block rounded-lg border border-slate-300 bg-white p-2" />
      </label>
      <button type="submit" disabled={guardando || !fecha || fecha === guardada} className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{guardando ? "Guardando…" : "Guardar aviso"}</button>
      {guardada && <button type="button" disabled={guardando} onClick={() => void guardar("")} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium disabled:opacity-50">Retirar aviso</button>}
    </form>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    {mensaje && <p role="status" className="mt-3 text-sm text-green-800">{mensaje}</p>}
  </section>;
}
