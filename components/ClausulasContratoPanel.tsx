"use client";

import { FormEvent, useState } from "react";
import { FilePlus2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { ClausulaContrato, TipoClausulaContrato } from "@/types";
import { supabase } from "@/lib/supabase";

type Props = { iniciales: ClausulaContrato[] };
type Formulario = { titulo: string; contenido: string; tipo_documento: TipoClausulaContrato; activa: boolean; orden: string };
const vacio = (): Formulario => ({ titulo: "", contenido: "", tipo_documento: "CONTRATO", activa: true, orden: "" });
const mensajeErrorClausulas = (error: { message: string }) =>
  error.message.includes("row-level security")
    ? "Falta activar la gestión de cláusulas en Supabase. Ejecuta una sola vez el archivo supabase/activar_clausulas_contrato.sql."
    : error.message;

export default function ClausulasContratoPanel({ iniciales }: Props) {
  const [clausulas, setClausulas] = useState(iniciales);
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<ClausulaContrato | null>(null);
  const [formulario, setFormulario] = useState<Formulario>(vacio);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const cambiar = <K extends keyof Formulario>(campo: K, valor: Formulario[K]) => setFormulario((actual) => ({ ...actual, [campo]: valor }));
  const abrirNuevo = () => { setEditando(null); setFormulario(vacio()); setError(""); setAbierto(true); };
  const abrirEdicion = (clausula: ClausulaContrato) => { setEditando(clausula); setFormulario({ titulo: clausula.titulo, contenido: clausula.contenido, tipo_documento: clausula.tipo_documento, activa: clausula.activa, orden: String(clausula.orden) }); setError(""); setAbierto(true); };
  const cerrar = () => { setAbierto(false); setEditando(null); setFormulario(vacio()); setError(""); };

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    if (!formulario.titulo.trim() || !formulario.contenido.trim()) { setError("Indica un título y el texto de la cláusula."); return; }
    setGuardando(true); setError("");
    const datos = { titulo: formulario.titulo.trim(), contenido: formulario.contenido.trim(), tipo_documento: formulario.tipo_documento, activa: formulario.activa, orden: Number(formulario.orden) || 0 };
    const consulta = editando ? supabase.from("clausulas_contrato").update(datos).eq("id", editando.id).select().single() : supabase.from("clausulas_contrato").insert(datos).select().single();
    const { data, error: errorGuardado } = await consulta;
    setGuardando(false);
    if (errorGuardado) { setError(mensajeErrorClausulas(errorGuardado)); return; }
    setClausulas((actuales) => editando ? actuales.map((clausula) => clausula.id === data.id ? data : clausula) : [...actuales, data].sort((a, b) => a.orden - b.orden));
    cerrar();
  }

  async function activar(clausula: ClausulaContrato) {
    const { error: errorActualizacion } = await supabase.from("clausulas_contrato").update({ activa: !clausula.activa }).eq("id", clausula.id);
    if (errorActualizacion) { alert(mensajeErrorClausulas(errorActualizacion)); return; }
    setClausulas((actuales) => actuales.map((actual) => actual.id === clausula.id ? { ...actual, activa: !actual.activa } : actual));
  }

  async function eliminar(clausula: ClausulaContrato) {
    if (!confirm(`Eliminar la cláusula “${clausula.titulo}”?`)) return;
    const { error: errorEliminacion } = await supabase.from("clausulas_contrato").delete().eq("id", clausula.id);
    if (errorEliminacion) { alert(mensajeErrorClausulas(errorEliminacion)); return; }
    setClausulas((actuales) => actuales.filter((actual) => actual.id !== clausula.id));
  }

  return <div><div className="flex flex-wrap items-start justify-between gap-5"><div><h1 className="text-3xl font-bold text-slate-900">Contratos y reservas</h1><p className="mt-2 max-w-3xl text-slate-500">Los modelos base se completan desde cada habitación. Añade cláusulas adicionales y decide si deben aparecer en el contrato, en la reserva o en ambos documentos.</p></div><button onClick={abrirNuevo} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"><Plus size={18} /> Nueva cláusula</button></div><section className="mt-8 grid gap-5 md:grid-cols-3"><Resumen titulo="Cláusulas adicionales" valor={String(clausulas.length)} /><Resumen titulo="Activas" valor={String(clausulas.filter((clausula) => clausula.activa).length)} /><Resumen titulo="Uso" valor="Contrato y reserva" /></section><section className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"><div className="flex items-center gap-3 border-b border-slate-200 p-5"><div className="rounded-lg bg-blue-100 p-2 text-blue-600"><FilePlus2 size={21} /></div><div><h2 className="font-bold text-slate-900">Cláusulas adicionales</h2><p className="text-sm text-slate-500">Las cláusulas activas se añaden automáticamente al generar el documento correspondiente.</p></div></div>{clausulas.length ? <div className="divide-y divide-slate-100">{clausulas.map((clausula) => <article key={clausula.id} className="flex flex-wrap items-start justify-between gap-4 p-5"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-900">{clausula.titulo}</h3><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{clausula.tipo_documento === "AMBOS" ? "Contrato y reserva" : clausula.tipo_documento === "CONTRATO" ? "Contrato" : "Reserva"}</span><button onClick={() => activar(clausula)} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${clausula.activa ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>{clausula.activa ? "Activa" : "Inactiva"}</button></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{clausula.contenido}</p></div><div className="flex gap-1"><button onClick={() => abrirEdicion(clausula)} title="Editar cláusula" className="rounded-lg p-2 text-blue-700 hover:bg-blue-50"><Pencil size={17} /></button><button onClick={() => eliminar(clausula)} title="Eliminar cláusula" className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 size={17} /></button></div></article>)}</div> : <p className="p-10 text-center text-slate-500">Todavía no hay cláusulas adicionales. Los modelos base seguirán utilizándose al generar los documentos.</p>}</section>{abierto && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"><form onSubmit={guardar} className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold">{editando ? "Editar cláusula" : "Nueva cláusula"}</h2><p className="mt-1 text-sm text-slate-500">Utiliza texto claro: se añadirá al final del documento.</p></div><button type="button" onClick={cerrar} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><X size={20} /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><Campo etiqueta="Título"><input value={formulario.titulo} onChange={(evento) => cambiar("titulo", evento.target.value)} placeholder="Ej.: Normas de convivencia" /></Campo><Campo etiqueta="Aplicar a"><select value={formulario.tipo_documento} onChange={(evento) => cambiar("tipo_documento", evento.target.value as TipoClausulaContrato)}><option value="CONTRATO">Contrato de alquiler</option><option value="RESERVA">Documento de reserva</option><option value="AMBOS">Contrato y reserva</option></select></Campo><Campo etiqueta="Orden" ayuda="Opcional; los números menores aparecen antes."><input inputMode="numeric" value={formulario.orden} onChange={(evento) => cambiar("orden", evento.target.value)} placeholder="10" /></Campo><label className="flex items-end gap-2 pb-2 text-sm font-medium"><input type="checkbox" checked={formulario.activa} onChange={(evento) => cambiar("activa", evento.target.checked)} /> Incluir al generar</label></div><Campo etiqueta="Texto de la cláusula"><textarea rows={7} value={formulario.contenido} onChange={(evento) => cambiar("contenido", evento.target.value)} placeholder="Escribe la condición que debe figurar en el documento..." /></Campo>{error && <p className="mt-3 text-sm text-red-600">{error}</p>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={cerrar} className="rounded-lg border px-4 py-2 font-semibold">Cancelar</button><button disabled={guardando} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-60"><Save size={17} /> {guardando ? "Guardando..." : "Guardar cláusula"}</button></div></form></div>}</div>;
}

function Resumen({ titulo, valor }: { titulo: string; valor: string }) { return <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">{titulo}</p><p className="mt-2 text-2xl font-bold text-slate-900">{valor}</p></article>; }
function Campo({ etiqueta, ayuda, children }: { etiqueta: string; ayuda?: string; children: React.ReactNode }) { return <label className="block text-sm font-medium text-slate-700">{etiqueta}{ayuda && <span className="ml-1 font-normal text-slate-400">{ayuda}</span>}<span className="mt-1.5 block [&>input]:w-full [&>input]:rounded-lg [&>input]:border [&>input]:border-slate-300 [&>input]:px-3 [&>input]:py-2 [&>select]:w-full [&>select]:rounded-lg [&>select]:border [&>select]:border-slate-300 [&>select]:px-3 [&>select]:py-2 [&>textarea]:mt-1.5 [&>textarea]:w-full [&>textarea]:rounded-lg [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:px-3 [&>textarea]:py-2">{children}</span></label>; }
