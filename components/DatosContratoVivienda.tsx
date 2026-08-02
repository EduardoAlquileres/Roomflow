"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Vivienda } from "@/types/vivienda";

export default function DatosContratoVivienda({ vivienda }: { vivienda: Vivienda }) {
  const [municipio, setMunicipio] = useState(vivienda.municipio ?? "");
  const [referencia, setReferencia] = useState(vivienda.referencia_catastral ?? "");
  const [entidad, setEntidad] = useState(vivienda.entidad_bancaria ?? "");
  const [iban, setIban] = useState(vivienda.iban_cobro ?? "");
  const [conceptos, setConceptos] = useState(vivienda.suministros_contrato ?? "agua, luz, gas e internet");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  async function guardar() {
    setGuardando(true); setMensaje("");
    const { error } = await supabase.from("viviendas").update({ municipio: municipio.trim() || null, referencia_catastral: referencia.trim() || null, entidad_bancaria: entidad.trim() || null, iban_cobro: iban.replace(/\s/g, "").toUpperCase() || null, suministros_contrato: conceptos.trim() || null }).eq("id", vivienda.id);
    setGuardando(false); setMensaje(error ? error.message : "Datos de contrato guardados.");
  }
  return <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-lg font-bold text-slate-900">Datos para contratos y reservas</h2><p className="mt-1 text-sm text-slate-500">Estos datos se usarán automáticamente al generar documentos para sus habitaciones.</p></div><button onClick={guardar} disabled={guardando} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"><Save size={17} />{guardando ? "Guardando..." : "Guardar datos"}</button></div><div className="mt-5 grid gap-4 md:grid-cols-2"><Campo etiqueta="Municipio"><input value={municipio} onChange={(e) => setMunicipio(e.target.value)} placeholder="Ej.: Inca" /></Campo><Campo etiqueta="Referencia catastral"><input value={referencia} onChange={(e) => setReferencia(e.target.value)} /></Campo><Campo etiqueta="Entidad bancaria"><input value={entidad} onChange={(e) => setEntidad(e.target.value)} placeholder="Ej.: CaixaBank" /></Campo><Campo etiqueta="IBAN de cobro"><input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="ES00 0000 0000 0000 0000 0000" /></Campo><Campo etiqueta="Conceptos facturados aparte" ancho><><input value={conceptos} onChange={(e) => setConceptos(e.target.value)} placeholder="Ej.: agua, luz, gas e internet" /><small className="mt-1 block text-slate-500">El importe se toma de los gastos configurados en cada habitación, como cuota por persona.</small></></Campo></div>{mensaje && <p className={`mt-4 text-sm ${mensaje === "Datos de contrato guardados." ? "text-green-700" : "text-red-600"}`}>{mensaje}</p>}</section>;
}

function Campo({ etiqueta, ancho = false, children }: { etiqueta: string; ancho?: boolean; children: React.ReactNode }) { return <label className={`text-sm font-medium text-slate-700 ${ancho ? "md:col-span-2" : ""}`}>{etiqueta}<span className="mt-1.5 block [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-slate-300 [&_input]:px-3 [&_input]:py-2 [&_input]:outline-none [&_input]:focus:border-blue-500">{children}</span></label>; }
