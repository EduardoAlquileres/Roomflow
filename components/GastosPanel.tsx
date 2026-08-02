"use client";

import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ExternalLink, FileText, Pencil, Plus, ReceiptText, Trash2, Upload } from "lucide-react";
import { CATEGORIAS_GASTO } from "@/constants/gastos";
import { crearGastos } from "@/lib/gastos";
import { abrirDocumentoGasto, eliminarDocumentoGasto, subirDocumentoGasto } from "@/lib/documentosGasto";
import { supabase } from "@/lib/supabase";
import { Gasto } from "@/types/gasto";
import { Vivienda } from "@/types/vivienda";

type Props = { gastosIniciales: Gasto[]; viviendas: Vivienda[] };
type Formulario = { fecha: string; viviendaId: string; compartido: boolean; categoria: string; concepto: string; proveedor: string; importe: string; estado: "PAGADO" | "PENDIENTE"; observaciones: string; archivo: File | null };

const moneda = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const inicial = (): Formulario => ({ fecha: new Date().toISOString().slice(0, 10), viviendaId: "", compartido: false, categoria: CATEGORIAS_GASTO[0], concepto: "", proveedor: "", importe: "", estado: "PAGADO", observaciones: "", archivo: null });
const mensajeError = (error: unknown) => typeof error === "object" && error && "message" in error && typeof error.message === "string" ? error.message : "No se pudo guardar el gasto.";

export default function GastosPanel({ gastosIniciales, viviendas }: Props) {
  const router = useRouter();
  const selectorArchivo = useRef<HTMLInputElement>(null);
  const camara = useRef<HTMLInputElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<Gasto | null>(null);
  const [form, setForm] = useState<Formulario>(inicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const activas = useMemo(() => viviendas.filter((vivienda) => vivienda.activa), [viviendas]);
  const total = gastosIniciales.filter((gasto) => gasto.estado !== "ANULADO").reduce((suma, gasto) => suma + Number(gasto.importe), 0);
  const cambiar = <K extends keyof Formulario>(campo: K, valor: Formulario[K]) => setForm((actual) => ({ ...actual, [campo]: valor }));

  function nuevo() { setEditando(null); setForm(inicial()); setError(""); setAbierto(true); }
  function editar(gasto: Gasto) { setEditando(gasto); setForm({ fecha: gasto.fecha, viviendaId: gasto.vivienda_id, compartido: false, categoria: gasto.categoria, concepto: gasto.concepto.replace(" (prorrateado)", ""), proveedor: gasto.proveedor ?? "", importe: String(gasto.importe), estado: gasto.estado === "PENDIENTE" ? "PENDIENTE" : "PAGADO", observaciones: gasto.observaciones ?? "", archivo: null }); setError(""); setAbierto(true); }
  function cerrar() { setAbierto(false); setEditando(null); setForm(inicial()); setError(""); }
  function seleccionarArchivo(evento: ChangeEvent<HTMLInputElement>) { cambiar("archivo", evento.target.files?.[0] ?? null); }

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    const importe = Number(form.importe.replace(",", "."));
    const destinos = form.compartido && !editando ? activas : viviendas.filter((vivienda) => vivienda.id === form.viviendaId);
    if (!form.fecha || !form.concepto.trim() || importe <= 0 || !destinos.length) { setError("Completa fecha, vivienda, concepto e importe."); return; }

    setGuardando(true); setError("");
    try {
      let gastosGuardados: Gasto[] = [];
      if (editando) {
        const { data, error: errorActualizar } = await supabase.from("gastos").update({ vivienda_id: form.viviendaId, fecha: form.fecha, categoria: form.categoria, concepto: form.concepto.trim(), proveedor: form.proveedor.trim() || null, importe, estado: form.estado, fecha_pago: form.estado === "PAGADO" ? form.fecha : null, observaciones: form.observaciones.trim() || null }).eq("id", editando.id).select().single();
        if (errorActualizar) throw errorActualizar;
        gastosGuardados = [data];
      } else {
        const parte = Math.floor((importe / destinos.length) * 100) / 100;
        gastosGuardados = await crearGastos(destinos.map((vivienda, indice) => ({ vivienda_id: vivienda.id, habitacion_id: null, fecha: form.fecha, categoria: form.categoria as Gasto["categoria"], concepto: form.compartido ? `${form.concepto.trim()} (prorrateado)` : form.concepto.trim(), proveedor: form.proveedor.trim() || null, importe: indice === destinos.length - 1 ? Number((importe - parte * (destinos.length - 1)).toFixed(2)) : parte, metodo_pago: null, es_recurrente: false, periodicidad: null, estado: form.estado, origen: "MANUAL" as const, fecha_pago: form.estado === "PAGADO" ? form.fecha : null, observaciones: form.observaciones.trim() || null, documento: null })));
      }

      if (form.archivo) {
        if (editando?.documento) await eliminarDocumentoGasto(editando.documento);
        await Promise.all(gastosGuardados.map((gasto) => subirDocumentoGasto(gasto.id, form.archivo!)));
      }
      cerrar(); router.refresh();
    } catch (causa) { setError(mensajeError(causa)); } finally { setGuardando(false); }
  }

  async function abrirDocumento(gasto: Gasto) {
    if (!gasto.documento) return;
    try { window.open(await abrirDocumentoGasto(gasto.documento), "_blank", "noopener,noreferrer"); } catch (causa) { alert(mensajeError(causa)); }
  }

  async function eliminar(gasto: Gasto) {
    if (!confirm(`Eliminar el gasto «${gasto.concepto}»?`)) return;
    const { error: errorEliminar } = await supabase.from("gastos").delete().eq("id", gasto.id);
    if (errorEliminar) { alert(errorEliminar.message); return; }
    if (gasto.documento) await eliminarDocumentoGasto(gasto.documento).catch(() => undefined);
    router.refresh();
  }

  return <div>
    <div className="flex flex-wrap items-start justify-between gap-5"><div><h1 className="text-3xl font-bold text-slate-900">Gastos</h1><p className="mt-2 text-slate-500">Los gastos se imputan a viviendas, nunca a habitaciones. Adjunta la factura o el recibo a cada gasto.</p></div><button onClick={nuevo} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"><Plus size={18} /> Nuevo gasto</button></div>
    <div className="mt-8 grid gap-5 md:grid-cols-3"><Resumen titulo="Gastos registrados" valor={String(gastosIniciales.length)} /><Resumen titulo="Importe registrado" valor={moneda.format(total)} /><Resumen titulo="Viviendas activas" valor={String(activas.length)} /></div>
    <section className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"><div className="flex items-center gap-3 border-b border-slate-200 p-5"><div className="rounded-lg bg-blue-100 p-2 text-blue-600"><ReceiptText size={21} /></div><div><h2 className="font-bold text-slate-900">Registro por vivienda</h2><p className="text-sm text-slate-500">Puedes modificar, borrar o abrir el justificante de cada gasto.</p></div></div>{gastosIniciales.length === 0 ? <p className="p-10 text-center text-slate-500">No hay gastos registrados.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left"><thead className="bg-slate-50 text-sm text-slate-600"><tr>{["Fecha", "Vivienda", "Concepto", "Categoría", "Tipo", "Importe", "Estado", "Documento", ""].map((titulo) => <th key={titulo} className="px-5 py-4 font-semibold">{titulo}</th>)}</tr></thead><tbody>{gastosIniciales.map((gasto) => { const prorrateado = gasto.es_prorrateado || gasto.concepto.includes("(prorrateado)"); return <tr key={gasto.id} className="border-t border-slate-100"><td className="px-5 py-4 text-slate-600">{new Intl.DateTimeFormat("es-ES").format(new Date(`${gasto.fecha}T00:00:00`))}</td><td className="px-5 py-4 font-medium">{viviendas.find((vivienda) => vivienda.id === gasto.vivienda_id)?.nombre ?? "Vivienda eliminada"}</td><td className="px-5 py-4">{gasto.concepto}</td><td className="px-5 py-4 text-slate-600">{gasto.categoria}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${prorrateado ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-600"}`}>{prorrateado ? "Prorrateado" : "Propio"}</span></td><td className="px-5 py-4 text-right font-semibold">{moneda.format(Number(gasto.importe))}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${gasto.estado === "PAGADO" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{gasto.estado}</span></td><td className="px-5 py-4">{gasto.documento ? <button onClick={() => abrirDocumento(gasto)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"><FileText size={16} /> Ver</button> : <span className="text-sm text-slate-400">Sin adjunto</span>}</td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={() => editar(gasto)} title="Editar gasto" className="rounded-lg p-2 text-blue-700 hover:bg-blue-50"><Pencil size={17} /></button><button onClick={() => eliminar(gasto)} title="Borrar gasto" className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 size={17} /></button></div></td></tr>; })}</tbody></table></div>}</section>
    {abierto && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"><form onSubmit={guardar} className="max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"><div className="flex items-start justify-between"><div><h2 className="text-xl font-bold">{editando ? "Editar gasto" : "Nuevo gasto"}</h2><p className="mt-1 text-sm text-slate-500">{editando ? "Actualiza el registro y sustituye el documento si lo necesitas." : "Selecciona una vivienda o reparte el gasto entre todas."}</p></div><button type="button" onClick={cerrar} className="text-sm font-semibold text-slate-600">Cancelar</button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><Campo etiqueta="Fecha"><input type="date" value={form.fecha} onChange={(e) => cambiar("fecha", e.target.value)} className="w-full rounded-lg border p-2" /></Campo><Campo etiqueta="Categoría"><select value={form.categoria} onChange={(e) => cambiar("categoria", e.target.value)} className="w-full rounded-lg border p-2">{CATEGORIAS_GASTO.map((categoria) => <option key={categoria}>{categoria}</option>)}</select></Campo><Campo etiqueta="Concepto" ancho><input value={form.concepto} onChange={(e) => cambiar("concepto", e.target.value)} className="w-full rounded-lg border p-2" /></Campo><Campo etiqueta="Proveedor"><input value={form.proveedor} onChange={(e) => cambiar("proveedor", e.target.value)} className="w-full rounded-lg border p-2" /></Campo><Campo etiqueta="Importe total (EUR)"><input inputMode="decimal" value={form.importe} onChange={(e) => cambiar("importe", e.target.value)} className="w-full rounded-lg border p-2" /></Campo></div><div className="mt-5 rounded-lg border p-4">{!editando && <label className="flex gap-3"><input type="checkbox" checked={form.compartido} onChange={(e) => cambiar("compartido", e.target.checked)} /><span><strong>Prorratear entre todas las viviendas activas</strong><span className="mt-1 block text-sm text-slate-500">Se crearán {activas.length} apuntes, cada uno con el mismo justificante si adjuntas uno.</span></span></label>} {(!form.compartido || editando) && <Campo etiqueta="Vivienda"><select value={form.viviendaId} onChange={(e) => cambiar("viviendaId", e.target.value)} className="mt-2 w-full rounded-lg border p-2"><option value="">Seleccionar...</option>{viviendas.map((vivienda) => <option value={vivienda.id} key={vivienda.id}>{vivienda.nombre}</option>)}</select></Campo>}</div><div className="mt-4 grid gap-4 sm:grid-cols-2"><Campo etiqueta="Estado"><select value={form.estado} onChange={(e) => cambiar("estado", e.target.value as Formulario["estado"])} className="w-full rounded-lg border p-2"><option value="PAGADO">Pagado</option><option value="PENDIENTE">Pendiente</option></select></Campo><Campo etiqueta="Observaciones"><input value={form.observaciones} onChange={(e) => cambiar("observaciones", e.target.value)} className="w-full rounded-lg border p-2" /></Campo></div><div className="mt-5 rounded-xl border border-dashed border-blue-200 bg-blue-50/50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-slate-800">Factura o recibo</p><p className="mt-1 text-sm text-slate-500">Imagen o PDF, máximo 10 MB. Desde el móvil puedes hacer la foto ahora.</p></div><div className="flex gap-2"><button type="button" onClick={() => camara.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700"><Camera size={17} /> Hacer foto</button><button type="button" onClick={() => selectorArchivo.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700"><Upload size={17} /> Adjuntar</button></div></div><input ref={camara} type="file" accept="image/*" capture="environment" onChange={seleccionarArchivo} className="hidden" /><input ref={selectorArchivo} type="file" accept="image/*,application/pdf" onChange={seleccionarArchivo} className="hidden" />{form.archivo ? <p className="mt-3 flex items-center gap-2 text-sm font-medium text-green-700"><FileText size={16} /> {form.archivo.name}</p> : editando?.documento ? <button type="button" onClick={() => abrirDocumento(editando)} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-700"><ExternalLink size={16} /> Ver documento actual</button> : null}</div>{error && <p className="mt-3 text-sm text-red-600">{error}</p>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={cerrar} className="rounded-lg border px-4 py-2 font-semibold">Cancelar</button><button disabled={guardando} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-60">{guardando ? "Guardando..." : editando ? "Guardar cambios" : "Registrar gasto"}</button></div></form></div>}
  </div>;
}

function Resumen({ titulo, valor }: { titulo: string; valor: string }) { return <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">{titulo}</p><p className="mt-2 text-3xl font-bold text-slate-900">{valor}</p></article>; }
function Campo({ etiqueta, ancho = false, children }: { etiqueta: string; ancho?: boolean; children: React.ReactNode }) { return <label className={`text-sm font-medium ${ancho ? "sm:col-span-2" : ""}`}>{etiqueta}<span className="mt-1 block">{children}</span></label>; }
