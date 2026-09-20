"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "#roomflow-supabase";

export type Suplemento = {
  id: string; estancia_id: string; concepto: string; importe: number;
  modalidad: "PUNTUAL" | "MENSUAL"; fecha_inicio: string; fecha_fin: string | null; prorratear: boolean;
};
type Estancia = { id: string; fecha_entrada: string; fecha_salida: string | null; estado: string };
const euros = (valor: number) => Number(valor).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
const vacio = { concepto: "", importe: "", modalidad: "", fecha_inicio: "", fecha_fin: "", prorrateo: "" };

export default function SuplementosPanel({ suplementos, estancias }: { suplementos: Suplemento[]; estancias: Estancia[] }) {
  const router = useRouter();
  const [form, setForm] = useState(vacio);
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<Suplemento | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const estancia = editando ? estancias.find((e) => e.id === editando.estancia_id) : estancias.find((e) => e.estado === "ACTIVA");
  const cambiar = (campo: keyof typeof vacio, valor: string) => setForm((anterior) => ({ ...anterior, [campo]: valor }));

  function editar(s: Suplemento) {
    setEditando(s); setError(""); setAbierto(true);
    setForm({ concepto: s.concepto, importe: String(s.importe), modalidad: s.modalidad, fecha_inicio: s.fecha_inicio, fecha_fin: s.fecha_fin ?? "", prorrateo: s.prorratear ? "dias" : "completo" });
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const importe = Number(form.importe.replace(",", "."));
    if (!estancia || !form.concepto.trim() || !Number.isFinite(importe) || importe <= 0 || importe >= 1000000 || !form.fecha_inicio || !form.modalidad || (form.modalidad === "MENSUAL" && !form.prorrateo)) {
      setError("Completa el concepto, el importe, la modalidad, la fecha y las condiciones del acuerdo."); return;
    }
    if (form.fecha_inicio < estancia.fecha_entrada || (estancia.fecha_salida && form.fecha_inicio > estancia.fecha_salida) || (form.fecha_fin && form.fecha_fin < form.fecha_inicio)) {
      setError("Revisa las fechas: el inicio debe estar dentro de la estancia y el fin no puede ser anterior."); return;
    }
    setGuardando(true); setError("");
    try {
      const datos = { estancia_id: estancia.id, concepto: form.concepto.trim(), importe: Math.round(importe * 100) / 100, modalidad: form.modalidad, fecha_inicio: form.fecha_inicio, fecha_fin: form.fecha_fin || null, prorratear: form.modalidad === "MENSUAL" && form.prorrateo === "dias" };
      const respuesta = editando ? await supabase.from("suplementos_estancia").update(datos).eq("id", editando.id).select("id") : await supabase.from("suplementos_estancia").insert(datos).select("id");
      if (respuesta.error) throw respuesta.error;
      if (!respuesta.data?.length) throw new Error("No se ha guardado el suplemento. Recarga la página.");
      setAbierto(false); setEditando(null); setForm(vacio); router.refresh();
    } catch (causa) { setError(typeof causa === "object" && causa && "message" in causa ? String(causa.message) : "No se pudo guardar el suplemento."); }
    finally { setGuardando(false); }
  }

  return <section className="rounded-xl border bg-white p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Suplementos acordados</h2><p className="mt-1 text-sm text-slate-500">Solo se aplican los importes y condiciones que registres para la estancia.</p></div><button disabled={!estancias.some((e) => e.estado === "ACTIVA")} onClick={() => { setEditando(null); setForm(vacio); setError(""); setAbierto(true); }} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-40">Añadir suplemento</button></div>
    {!estancias.some((e) => e.estado === "ACTIVA") && <p className="mt-3 text-sm text-slate-500">Podrás añadirlo cuando haya una estancia activa.</p>}
    {!suplementos.length && <p className="mt-4 text-slate-500">No hay suplementos acordados.</p>}
    <div className="mt-4 space-y-3">{suplementos.map((s) => <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div><p className="font-semibold">{s.concepto}</p><p className="text-sm text-slate-600">{euros(s.importe)} · {s.modalidad === "PUNTUAL" ? "Puntual (un solo cobro)" : "Mensual"} · Desde {s.fecha_inicio}{s.fecha_fin ? ` hasta ${s.fecha_fin}` : " hasta el fin de la estancia"}</p><p className="text-sm text-slate-500">{s.modalidad === "MENSUAL" ? s.prorratear ? "Meses incompletos por días, inicio y fin incluidos." : "Importe completo en cada mes del acuerdo." : "Se cobra en el mes de inicio del acuerdo."}{estancias.find((e) => e.id === s.estancia_id)?.estado === "FINALIZADA" ? " Estancia finalizada." : ""}</p></div><button onClick={() => editar(s)} className="font-semibold text-blue-700">Editar</button></div>)}</div>
    {abierto && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"><form onSubmit={guardar} role="dialog" aria-modal="true" aria-labelledby="suplemento-titulo" className="max-h-[90dvh] w-full max-w-lg space-y-4 overflow-y-auto rounded-xl bg-white p-6">
      <h2 id="suplemento-titulo" className="text-xl font-bold">{editando ? "Editar suplemento" : "Añadir suplemento"}</h2>
      <label className="block text-sm font-medium">Concepto<input required maxLength={200} value={form.concepto} onChange={(e) => cambiar("concepto", e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
      <label className="block text-sm font-medium">Importe acordado (€)<input required type="number" step="0.01" min="0.01" max="999999.99" value={form.importe} onChange={(e) => cambiar("importe", e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
      <label className="block text-sm font-medium">Modalidad<select required value={form.modalidad} onChange={(e) => cambiar("modalidad", e.target.value)} className="mt-1 w-full rounded-lg border p-2"><option value="">Seleccionar…</option><option value="PUNTUAL">Importe puntual para todo el acuerdo</option><option value="MENSUAL">Importe cada mes</option></select></label>
      <div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium">Fecha de inicio<input required type="date" min={estancia?.fecha_entrada} max={estancia?.fecha_salida ?? undefined} value={form.fecha_inicio} onChange={(e) => cambiar("fecha_inicio", e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label><label className="text-sm font-medium">Fecha de fin (opcional)<input type="date" min={form.fecha_inicio} value={form.fecha_fin} onChange={(e) => cambiar("fecha_fin", e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label></div>
      <p className="text-sm text-slate-500">Sin fecha de fin, termina con la estancia. Un importe puntual se añade solo al mes de inicio, aunque el acuerdo dure varios meses.</p>
      {form.modalidad === "MENSUAL" && <label className="block text-sm font-medium">Meses incompletos<select required value={form.prorrateo} onChange={(e) => cambiar("prorrateo", e.target.value)} className="mt-1 w-full rounded-lg border p-2"><option value="">Seleccionar…</option><option value="completo">Cobrar el importe completo</option><option value="dias">Ajustar por días (inicio y fin incluidos)</option></select></label>}
      <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">Al guardar se actualizarán los cobros existentes del periodo acordado, incluso los pagados, y se incluirá en los futuros. Se conservan los pagos anotados. No se realizan devoluciones automáticas.</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-3"><button type="button" disabled={guardando} onClick={() => setAbierto(false)} className="rounded-lg border px-4 py-2">Cancelar</button><button disabled={guardando} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{guardando ? "Guardando…" : "Guardar suplemento"}</button></div>
    </form></div>}
  </section>;
}
