"use client";
import { useEffect, useState } from "react";
import { obtenerDatosFinalizacion } from "@/lib/datosFinalizacion";
import { crearFinalizacionPdf } from "@/lib/finalizacionPdf";

export default function FinalizacionContratoButton({ estanciaId }: { estanciaId: string }) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [preparando, setPreparando] = useState(false);
  const [compartiendo, setCompartiendo] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  async function preparar() {
    setPreparando(true); setError(""); setArchivo(null); setUrl("");
    try { const datos = await obtenerDatosFinalizacion(estanciaId); const pdf = crearFinalizacionPdf(datos); const nuevo = new File([pdf.output("blob")], `Finalizacion-${datos.salida}-${estanciaId.slice(0,8)}.pdf`, { type: "application/pdf" }); setArchivo(nuevo); setUrl(URL.createObjectURL(nuevo)); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo preparar el documento."); }
    finally { setPreparando(false); }
  }
  async function compartir() {
    if (!archivo || compartiendo) return;
    setError("");
    if (!navigator.share || !navigator.canShare?.({ files: [archivo] })) { setError("Descarga el PDF y adjúntalo en WhatsApp como documento."); return; }
    setCompartiendo(true);
    try { await navigator.share({ files: [archivo] }); }
    catch (e) { if (!(e instanceof DOMException && e.name === "AbortError")) setError("No se pudo compartir. Puedes descargar el PDF y adjuntarlo en WhatsApp."); }
    finally { setCompartiendo(false); }
  }
  const estilo = "rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 disabled:opacity-50";
  return <div className="mt-3 text-left">
    <button type="button" disabled={preparando || compartiendo} onClick={preparar} className={estilo}>{preparando ? "Preparando..." : "Documento de finalización"}</button>
    {archivo && url && <div role="region" aria-label="Documento de finalización preparado" className="mt-3 rounded-lg border bg-slate-50 p-3">
      <p className="text-sm text-slate-600">PDF listo para revisar y firmar. Los importes corresponden a los registros actuales.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={url} target="_blank" rel="noopener noreferrer" className={estilo}>Abrir / imprimir PDF</a>
        <button type="button" disabled={compartiendo} onClick={compartir} className={estilo}>{compartiendo ? "Compartiendo..." : "Compartir PDF / WhatsApp"}</button>
        <a href={url} download={archivo.name} className={estilo}>Descargar PDF</a>
      </div>
    </div>}
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
  </div>;
}
