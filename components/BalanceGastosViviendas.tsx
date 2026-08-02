"use client";

import { useState } from "react";
import { BarChart3, CalendarDays } from "lucide-react";
import { Cobro } from "@/types/cobro";

type Props = {
  cobros: Cobro[];
  gastos: Array<{ vivienda_id: string; fecha: string; importe: number; estado: string }>;
  habitaciones: Array<{ id: string; vivienda_id: string }>;
  viviendas: Array<{ id: string; nombre: string }>;
};

const moneda = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const nombreMes = (mes: number) => new Intl.DateTimeFormat("es-ES", { month: "long" }).format(new Date(2026, mes - 1, 1));

export default function BalanceGastosViviendas({ cobros, gastos, habitaciones, viviendas }: Props) {
  const hoy = new Date();
  const periodoActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
  const [periodo, setPeriodo] = useState(periodoActual);
  const [anio, mes] = periodo.split("-").map(Number);

  const periodos = [...new Set([
    periodoActual,
    ...cobros.map((cobro) => `${cobro.periodo_anio}-${String(cobro.periodo_mes).padStart(2, "0")}`),
    ...gastos.map((gasto) => gasto.fecha.slice(0, 7)),
  ])].sort((a, b) => b.localeCompare(a));

  const filas = viviendas.map((vivienda) => {
    const habitacionesVivienda = new Set(
      habitaciones.filter((habitacion) => habitacion.vivienda_id === vivienda.id).map((habitacion) => habitacion.id)
    );
    const repercutido = cobros
      .filter((cobro) => cobro.periodo_mes === mes && cobro.periodo_anio === anio && habitacionesVivienda.has(cobro.habitacion_id))
      .reduce((total, cobro) => total + Number(cobro.gastos), 0);
    const real = gastos
      .filter((gasto) => {
        const fecha = new Date(`${gasto.fecha}T12:00:00`);
        return gasto.vivienda_id === vivienda.id && gasto.estado !== "ANULADO" && fecha.getMonth() + 1 === mes && fecha.getFullYear() === anio;
      })
      .reduce((total, gasto) => total + Number(gasto.importe), 0);
    return { vivienda, repercutido, real, saldo: repercutido - real };
  });

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-violet-100 p-2 text-violet-700"><BarChart3 size={21} /></div>
          <div>
            <h2 className="font-bold text-slate-900">Balance de gastos por vivienda</h2>
            <p className="text-sm text-slate-500">Compara los gastos facturados a inquilinos con los gastos reales registrados.</p>
          </div>
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
          <CalendarDays size={17} className="text-slate-500" />
          <span className="sr-only">Periodo del balance</span>
          <select value={periodo} onChange={(event) => setPeriodo(event.target.value)} className="bg-transparent outline-none">
            {periodos.map((valor) => {
              const [anioOpcion, mesOpcion] = valor.split("-").map(Number);
              return <option key={valor} value={valor}>{nombreMes(mesOpcion)} {anioOpcion}</option>;
            })}
          </select>
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-left">
          <thead className="bg-slate-50 text-sm text-slate-600"><tr><th className="px-5 py-4 font-semibold">Vivienda</th><th className="px-5 py-4 text-right font-semibold">Gastos facturados</th><th className="px-5 py-4 text-right font-semibold">Gastos reales</th><th className="px-5 py-4 text-right font-semibold">Saldo</th></tr></thead>
          <tbody>{filas.map((fila) => <tr key={fila.vivienda.id} className="border-t border-slate-100"><td className="px-5 py-4 font-semibold text-slate-900">{fila.vivienda.nombre}</td><td className="px-5 py-4 text-right text-slate-700">{moneda.format(fila.repercutido)}</td><td className="px-5 py-4 text-right text-slate-700">{moneda.format(fila.real)}</td><td className={`px-5 py-4 text-right font-bold ${fila.saldo < 0 ? "text-red-600" : "text-green-700"}`}>{moneda.format(fila.saldo)}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
