"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Propietario, Titularidad } from "@/lib/propietarios";

type Props = { viviendaId: string; propietarios: Propietario[]; titularesIniciales: Titularidad[] };

export default function PropietariosVivienda({ viviendaId, propietarios, titularesIniciales }: Props) {
  const router = useRouter();
  const [titulares, setTitulares] = useState(titularesIniciales);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  function marcar(id: string, marcado: boolean) {
    setTitulares((actuales) => marcado ? [...actuales, { propietario_id: id, porcentaje: actuales.length ? 50 : 100 }] : actuales.filter((titular) => titular.propietario_id !== id));
  }

  function porcentaje(id: string, valor: number) {
    setTitulares((actuales) => actuales.map((titular) => titular.propietario_id === id ? { ...titular, porcentaje: valor } : titular));
  }

  async function guardar() {
    const suma = titulares.reduce((total, titular) => total + titular.porcentaje, 0);
    if (!titulares.length || Math.abs(suma - 100) > 0.01) { setMensaje("Selecciona uno o varios propietarios y haz que sumen 100%."); return; }
    setGuardando(true); setMensaje("");
    const { error: errorEliminar } = await supabase.from("vivienda_propietarios").delete().eq("vivienda_id", viviendaId);
    if (errorEliminar) { setGuardando(false); setMensaje(errorEliminar.message); return; }
    const { error: errorInsertar } = await supabase.from("vivienda_propietarios").insert(titulares.map((titular) => ({ vivienda_id: viviendaId, propietario_id: titular.propietario_id, porcentaje: titular.porcentaje })));
    setGuardando(false);
    setMensaje(errorInsertar ? errorInsertar.message : "Titularidad guardada.");
  }

  async function crearPropietarios() {
    setGuardando(true); setMensaje("");
    const { error } = await supabase.from("propietarios").upsert([
      { nombre_completo: "Eduardo Pons Esquiva", documento: "43059518E" },
      { nombre_completo: "Eva Marina Campaner Moran", documento: "43111836S" },
    ], { onConflict: "documento" });
    setGuardando(false);
    if (error) { setMensaje(error.message); return; }
    router.refresh();
  }

  if (!propietarios.length) return <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-lg font-bold text-slate-900">Propietarios de la vivienda</h2><p className="mt-2 text-sm text-amber-700">No hay propietarios configurados todavía.</p><button onClick={crearPropietarios} disabled={guardando} className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{guardando ? "Creando..." : "Crear Eduardo y Eva"}</button>{mensaje && <p className="mt-3 text-sm text-red-600">{mensaje}</p>}</section>;

  return <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-lg font-bold text-slate-900">Propietarios de la vivienda</h2><p className="mt-1 text-sm text-slate-500">Se usarán en documentos y para atribuir los gastos de esta vivienda.</p></div><button onClick={guardar} disabled={guardando} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"><Save size={17} />{guardando ? "Guardando..." : "Guardar titulares"}</button></div><div className="mt-5 space-y-3">{propietarios.map((propietario) => { const titular = titulares.find((item) => item.propietario_id === propietario.id); return <div key={propietario.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-4"><input type="checkbox" checked={Boolean(titular)} onChange={(event) => marcar(propietario.id, event.target.checked)} /><div className="min-w-52 flex-1"><p className="font-semibold text-slate-900">{propietario.nombre_completo}</p><p className="text-sm text-slate-500">DNI: {propietario.documento}</p></div>{titular && <label className="flex items-center gap-2 text-sm font-medium text-slate-700">Participación<input type="number" min="1" max="100" value={titular.porcentaje} onChange={(event) => porcentaje(propietario.id, Number(event.target.value))} className="w-20 rounded-lg border border-slate-300 px-2 py-1.5" />%</label>}</div>; })}</div>{mensaje && <p className={`mt-4 text-sm ${mensaje === "Titularidad guardada." ? "text-green-700" : "text-red-600"}`}>{mensaje}</p>}</section>;
}
