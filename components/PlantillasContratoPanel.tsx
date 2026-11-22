"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Eye, FileText, Printer, X } from "lucide-react";
import { plantillasContrato, vistaPreviaPlantilla, type PlantillaId } from "@/lib/plantillasContrato";
import type { ClausulaContrato } from "@/types";

export default function PlantillasContratoPanel({ clausulas }: { clausulas: ClausulaContrato[] }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [seleccion, setSeleccion] = useState<PlantillaId | null>(null);
  const [varios, setVarios] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); }, [pdfUrl]);
  useEffect(() => {
    if (seleccion) dialogo.current?.showModal();
    else dialogo.current?.close();
  }, [seleccion]);
  const plantilla = plantillasContrato.find(p => p.id === seleccion);
  const html = seleccion && seleccion !== "finalizacion" ? vistaPreviaPlantilla(seleccion, clausulas, varios) : "";

  async function abrir(id: PlantillaId) {
    setError(""); setVarios(false);
    if (id === "finalizacion") {
      setCargando(true);
      try {
        const { crearFinalizacionPdf } = await import("@/lib/finalizacionPdf");
        const pdf = crearFinalizacionPdf({
          vivienda: "[DIRECCIÓN DE LA VIVIENDA]", habitacion: "[HABITACIÓN]", entrada: "", salida: "",
          propietarios: ["[NOMBRE Y DOCUMENTO DE LOS PROPIETARIOS]"], titulares: ["[NOMBRE Y DOCUMENTO DE TODOS LOS TITULARES]"],
          fianza: ["Fianza entregada: [IMPORTE]. Estado: [ESTADO].", "Importe devuelto: [IMPORTE]. Importe retenido: [IMPORTE]. Motivo: [MOTIVO, SI PROCEDE]."],
          pendientes: [], observaciones: "[OBSERVACIONES, SI PROCEDE]",
        }, new Date(), true);
        setPdfUrl(URL.createObjectURL(pdf.output("blob")));
      } catch {
        setError("No se pudo abrir la plantilla de finalización. Inténtalo de nuevo.");
        return;
      } finally { setCargando(false); }
    }
    setSeleccion(id);
  }
  function cerrar() { setSeleccion(null); }
  function imprimir() {
    const ventana = window.open("", "_blank");
    if (!ventana) { setError("Permite las ventanas emergentes para imprimir la plantilla."); return; }
    ventana.opener = null;
    ventana.document.write(html); ventana.document.close(); ventana.focus(); ventana.print();
  }

  return <section className="mt-8" aria-labelledby="plantillas-titulo">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div><h2 id="plantillas-titulo" className="text-xl font-bold text-slate-900">Plantillas de documentos <span className="ml-2 rounded-full bg-slate-200 px-2.5 py-1 text-sm">{plantillasContrato.length}</span></h2>
        <p className="mt-1 text-sm text-slate-600">Consulta el texto completo de cada modelo. Las vistas previas incluyen las cláusulas adicionales activas que correspondan.</p></div>
      <Link href="/habitaciones" className="text-sm font-semibold text-blue-700 underline underline-offset-4">Ir a habitaciones para generar un documento</Link>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      {plantillasContrato.map(p => <article key={p.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-800"><FileText size={18} /><span>{p.tipo}</span></div>
        <h3 className="mt-3 text-lg font-bold text-slate-900">{p.nombre}</h3>
        <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{p.descripcion}</p>
        <p className="mt-3 text-xs font-medium text-slate-500">{p.detalle}</p>
        <button type="button" disabled={cargando} onClick={() => abrir(p.id)} aria-label={`Ver plantilla: ${p.nombre}`} className="mt-5 inline-flex items-center justify-center gap-2 self-start rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-100 disabled:opacity-50"><Eye size={17} />{cargando && p.id === "finalizacion" ? "Abriendo…" : "Ver plantilla"}</button>
      </article>)}
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    <dialog ref={dialogo} aria-labelledby="vista-plantilla-titulo" onClose={() => { if (!dialogo.current?.open) { setSeleccion(null); setPdfUrl(""); } }} className="fixed inset-0 m-auto h-[92dvh] max-h-none w-[min(1100px,96vw)] max-w-none overflow-hidden rounded-2xl bg-white p-0 shadow-xl backdrop:bg-slate-950/60">
      <div className="flex h-full flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div><h2 id="vista-plantilla-titulo" className="font-bold text-slate-900">{plantilla?.nombre}</h2><p className="mt-1 text-xs text-slate-600">Modelo de consulta · completa los datos reales desde la habitación.</p></div>
          <div className="flex items-center gap-3">
            {seleccion !== "finalizacion" && <button type="button" onClick={imprimir} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold"><Printer size={16} />Imprimir / PDF</button>}
            {seleccion === "finalizacion" && pdfUrl && <a href={pdfUrl} download="Plantilla_finalizacion_contrato.pdf" className="rounded-lg border px-3 py-2 text-sm font-semibold">Descargar PDF</a>}
            <button type="button" onClick={cerrar} aria-label="Cerrar vista previa" className="rounded-lg p-2 hover:bg-slate-100"><X size={20} /></button>
          </div>
        </header>
        {seleccion !== "finalizacion" && <label className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 text-sm"><input type="checkbox" checked={varios} onChange={e => setVarios(e.target.checked)} />Mostrar modelo con varios titulares</label>}
        {error && <p role="alert" className="px-4 py-2 text-sm text-red-700">{error}</p>}
        {seleccion === "finalizacion" ? pdfUrl && <iframe title="Plantilla de finalización del contrato" src={pdfUrl} className="min-h-0 flex-1 border-0" /> : seleccion && <iframe title={`Vista previa: ${plantilla?.nombre}`} srcDoc={html} sandbox="" className="min-h-0 flex-1 border-0 bg-white" />}
      </div>
    </dialog>
  </section>;
}
