"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Props = { inquilinoId: string; habitacionId: string; nombreInquilino: string };

export default function AnularCheckInButton({ inquilinoId, habitacionId, nombreInquilino }: Props) {
  const router = useRouter();
  const [anulando, setAnulando] = useState(false);
  async function anular() {
    if (!confirm(`¿Anular el check-in de ${nombreInquilino}? Se eliminarán los datos creados para esta entrada y la habitación quedará libre. Esta acción no registra un check-out.`)) return;
    setAnulando(true);
    try {
      const { data: cobros, error: errorCobros } = await supabase.from("cobros").select("id, pagado").eq("inquilino_id", inquilinoId);
      if (errorCobros) throw errorCobros;
      if ((cobros ?? []).some((cobro) => Number(cobro.pagado) > 0)) throw new Error("No se puede anular un check-in que ya tiene pagos registrados. Corrige los datos o realiza un check-out.");
      const { error: errorEliminarCobros } = await supabase.from("cobros").delete().eq("inquilino_id", inquilinoId);
      if (errorEliminarCobros) throw errorEliminarCobros;
      const { error: errorEliminarInquilino } = await supabase.from("inquilinos").delete().eq("id", inquilinoId);
      if (errorEliminarInquilino) throw errorEliminarInquilino;
      const { error: errorHabitacion } = await supabase.from("habitaciones").update({ estado: "LIBRE" }).eq("id", habitacionId);
      if (errorHabitacion) throw errorHabitacion;
      router.refresh();
    } catch (error) { alert(error instanceof Error ? error.message : "No se pudo anular el check-in."); }
    finally { setAnulando(false); }
  }
  return <button type="button" onClick={anular} disabled={anulando} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60">{anulando ? "Anulando..." : "Anular Check-In"}</button>;
}
