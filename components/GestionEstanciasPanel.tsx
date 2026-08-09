"use client";

import { useMemo, useState } from "react";
import { CalendarRange, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Estancia, Habitacion, Vivienda } from "@/types";

type Props = {
  inquilinoId: string;
  estancias: Estancia[];
  habitaciones: Habitacion[];
  viviendas: Vivienda[];
  onActualizado: () => void;
};

type Formulario = {
  id: string | null;
  esActiva: boolean;
  habitacionId: string;
  fechaEntrada: string;
  fechaSalida: string;
  precio: string;
  gastos: string;
};

const fechaCampo = (fecha: string | null) => fecha?.slice(0, 10) ?? "";
const euros = (importe: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(importe);

export default function GestionEstanciasPanel({
  inquilinoId,
  estancias,
  habitaciones,
  viviendas,
  onActualizado,
}: Props) {
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const habitacionesOrdenadas = useMemo(
    () =>
      [...habitaciones].sort((a, b) => {
        const etiqueta = (habitacion: Habitacion) =>
          `${viviendas.find((v) => v.id === habitacion.vivienda_id)?.nombre ?? ""} ${habitacion.codigo}`;
        return etiqueta(a).localeCompare(etiqueta(b), "es");
      }),
    [habitaciones, viviendas]
  );

  const datosHabitacion = (habitacionId: string) =>
    habitaciones.find((habitacion) => habitacion.id === habitacionId);

  function abrirNueva() {
    const habitacion = habitacionesOrdenadas[0];
    setError("");
    setFormulario({
      id: null,
      esActiva: false,
      habitacionId: habitacion?.id ?? "",
      fechaEntrada: "",
      fechaSalida: "",
      precio: String(habitacion?.precio ?? ""),
      gastos: String(habitacion?.gastos ?? ""),
    });
  }

  function editar(estancia: Estancia) {
    setError("");
    setFormulario({
      id: estancia.id,
      esActiva: estancia.estado === "ACTIVA",
      habitacionId: estancia.habitacion_id,
      fechaEntrada: fechaCampo(estancia.fecha_entrada),
      fechaSalida: fechaCampo(estancia.fecha_salida),
      precio: String(estancia.precio),
      gastos: String(estancia.gastos),
    });
  }

  function cambiarHabitacion(habitacionId: string) {
    const habitacion = datosHabitacion(habitacionId);
    setFormulario((actual) =>
      actual
        ? {
            ...actual,
            habitacionId,
            precio: String(habitacion?.precio ?? actual.precio),
            gastos: String(habitacion?.gastos ?? actual.gastos),
          }
        : actual
    );
  }

  async function guardar() {
    if (!formulario || !formulario.habitacionId || !formulario.fechaEntrada || (!formulario.esActiva && !formulario.fechaSalida) || !formulario.precio || !formulario.gastos) {
      setError("Completa habitación, fechas, alquiler y gastos.");
      return;
    }
    if (!formulario.esActiva && formulario.fechaSalida < formulario.fechaEntrada) {
      setError("La fecha de salida debe ser igual o posterior a la entrada.");
      return;
    }

    setGuardando(true);
    setError("");
    const valores = {
      habitacion_id: formulario.habitacionId,
      fecha_entrada: formulario.fechaEntrada,
      fecha_salida: formulario.esActiva ? null : formulario.fechaSalida,
      precio: Number(formulario.precio),
      gastos: Number(formulario.gastos),
      estado: formulario.esActiva ? "ACTIVA" : "FINALIZADA",
    };
    const respuesta = formulario.id
      ? await supabase.from("estancias").update(valores).eq("id", formulario.id)
      : await supabase.from("estancias").insert({
          ...valores,
          inquilino_id: inquilinoId,
          fianza: 0,
          observaciones: "Estancia histórica regularizada.",
        });

    setGuardando(false);
    if (respuesta.error) {
      setError(respuesta.error.message);
      return;
    }
    setFormulario(null);
    onActualizado();
  }

  async function eliminar(estancia: Estancia) {
    if (!window.confirm("¿Eliminar esta estancia histórica? La ficha del inquilino se conservará.")) return;
    const { error: errorEliminar } = await supabase.from("estancias").delete().eq("id", estancia.id);
    if (errorEliminar) {
      setError(errorEliminar.message);
      return;
    }
    onActualizado();
  }

  return (
    <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-violet-100 p-2 text-violet-700"><CalendarRange size={21} /></div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Historial de habitaciones</h2>
            <p className="mt-1 text-sm text-slate-500">Cada etapa conserva vivienda, habitación, fechas y precio propios.</p>
          </div>
        </div>
        <button type="button" onClick={abrirNueva} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">
          <Plus size={17} /> Añadir estancia anterior
        </button>
      </div>
      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-5 divide-y divide-slate-100">
        {estancias.map((estancia) => {
          const habitacion = datosHabitacion(estancia.habitacion_id);
          const vivienda = habitacion ? viviendas.find((item) => item.id === habitacion.vivienda_id) : undefined;
          const esActiva = estancia.estado === "ACTIVA";
          return (
            <div key={estancia.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div>
                <p className="font-semibold text-slate-900">{vivienda?.nombre ?? "Vivienda"} · Habitación {habitacion?.codigo ?? "—"}</p>
                <p className="mt-1 text-sm text-slate-500">{fechaCampo(estancia.fecha_entrada)} a {fechaCampo(estancia.fecha_salida) || "en curso"} · {euros(Number(estancia.precio))} + {euros(Number(estancia.gastos))} gastos</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${esActiva ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}>{esActiva ? "Actual" : "Finalizada"}</span>
                <button type="button" onClick={() => editar(estancia)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" title={esActiva ? "Corregir estancia actual" : "Editar estancia"}><Pencil size={18} /></button>
                {!esActiva && <>
                  <button type="button" onClick={() => eliminar(estancia)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" title="Eliminar estancia"><Trash2 size={18} /></button>
                </>}
              </div>
            </div>
          );
        })}
      </div>
      {formulario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div><h3 className="text-xl font-bold text-slate-900">{formulario.id ? "Editar estancia anterior" : "Añadir estancia anterior"}</h3><p className="mt-1 text-sm text-slate-500">Indica los importes que tenía esa habitación durante ese periodo.</p></div>
              <button type="button" onClick={() => setFormulario(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">Vivienda y habitación
                <select value={formulario.habitacionId} onChange={(event) => cambiarHabitacion(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
                  <option value="">Selecciona una habitación</option>
                  {habitacionesOrdenadas.map((habitacion) => <option key={habitacion.id} value={habitacion.id}>{viviendas.find((vivienda) => vivienda.id === habitacion.vivienda_id)?.nombre ?? "Vivienda"} · {habitacion.codigo}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">Fecha de entrada<input type="date" value={formulario.fechaEntrada} onChange={(event) => setFormulario({ ...formulario, fechaEntrada: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              {formulario.esActiva ? (
                <div className="text-sm text-slate-500">
                  <span className="font-medium text-slate-700">Situación</span>
                  <p className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-green-700">Estancia actual, sin fecha de salida.</p>
                </div>
              ) : (
                <label className="text-sm font-medium text-slate-700">Fecha de salida<input type="date" value={formulario.fechaSalida} onChange={(event) => setFormulario({ ...formulario, fechaSalida: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              )}
              <label className="text-sm font-medium text-slate-700">Alquiler mensual<input type="number" min="0" step="0.01" value={formulario.precio} onChange={(event) => setFormulario({ ...formulario, precio: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              <label className="text-sm font-medium text-slate-700">Gastos por persona<input type="number" min="0" step="0.01" value={formulario.gastos} onChange={(event) => setFormulario({ ...formulario, gastos: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            </div>
            {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setFormulario(null)} className="rounded-lg border px-4 py-2 font-semibold text-slate-700">Cancelar</button><button type="button" disabled={guardando} onClick={guardar} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-60"><Save size={17} /> {guardando ? "Guardando..." : "Guardar estancia"}</button></div>
          </div>
        </div>
      )}
    </section>
  );
}
