"use client";

import { useRef, useState } from "react";
import { FileText } from "lucide-react";
import { documentoGastoExtra, obtenerDatosGastoExtra } from "@/lib/reciboGastoExtra";
import { descargarReciboPdf } from "@/lib/reciboPdf";

export default function ReciboGastoExtraButton({ suplementoId }: { suplementoId: string }) {
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState("");
  const ocupado = useRef(false);
  async function generar() {
    if (ocupado.current) return;
    ocupado.current = true; setGenerando(true); setError("");
    try {
      const datos = await obtenerDatosGastoExtra(suplementoId);
      descargarReciboPdf(documentoGastoExtra(datos), `Recibo-gasto-extra-${datos.gasto.fecha_inicio}-${datos.gasto.id}.pdf`);
    } catch (causa) {
      setError(causa && typeof causa === "object" && "message" in causa ? String(causa.message) : "No se pudo generar el recibo del gasto extra.");
    } finally { ocupado.current = false; setGenerando(false); }
  }
  return <div><button type="button" disabled={generando} onClick={generar} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 disabled:opacity-50"><FileText size={16} />{generando ? "Generando…" : "Recibo del gasto extra"}</button>{error && <p role="alert" className="mt-2 max-w-xs text-sm text-red-700">{error}</p>}</div>;
}
