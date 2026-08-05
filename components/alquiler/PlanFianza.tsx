"use client";

import { NuevoAlquiler } from "@/types/nuevoAlquiler";

type Props = { datos: NuevoAlquiler; setDatos: React.Dispatch<React.SetStateAction<NuevoAlquiler>>; esReserva?: boolean };

export default function PlanFianza({ datos, setDatos, esReserva = false }: Props) {
  const inicial = Math.max(0, Number(datos.importeFianzaInicial) || 0);
  const total = Math.max(0, Number(datos.fianza) || 0);
  const cuotas = Math.max(1, Math.min(12, Number(datos.numeroCuotasFianza) || 1));
  const pendiente = Math.max(0, total - inicial);
  const porCuota = pendiente / cuotas;

  function cambiarInicial(valor: number) {
    setDatos((actual) => ({ ...actual, importeFianzaInicial: valor, ...(esReserva ? { importeReserva: valor } : {}) }));
  }

  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 md:col-span-2">
      <h3 className="font-semibold text-slate-900">Plan de pago de la fianza</h3>
      <p className="mt-1 text-sm text-slate-600">Por defecto se entrega la mitad al inicio y el resto se divide en los dos meses siguientes. Puedes modificarlo ahora según lo pactado.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">{esReserva ? "Entrega inicial con la reserva (€)" : "Entrega inicial en la entrada (€)"}
          <input type="number" min="0" max={total} step="0.01" value={inicial} onChange={(event) => cambiarInicial(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2" />
        </label>
        <label className="text-sm font-medium text-slate-700">Cuotas posteriores
          <input type="number" min="1" max="12" step="1" value={cuotas} onChange={(event) => setDatos((actual) => ({ ...actual, numeroCuotasFianza: Math.max(1, Math.min(12, Number(event.target.value) || 1)) }))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2" />
        </label>
      </div>
      {inicial > total ? <p className="mt-3 text-sm font-medium text-red-700">La entrega inicial no puede superar la fianza pactada.</p> : <div className="mt-4 rounded-lg bg-white p-3 text-sm text-slate-700"><p><strong>Al inicio:</strong> {inicial.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</p><p className="mt-1"><strong>Meses siguientes:</strong> {cuotas} cuota{cuotas === 1 ? "" : "s"} de {porCuota.toLocaleString("es-ES", { style: "currency", currency: "EUR" })} aproximadamente.</p><p className="mt-1"><strong>Pendiente total:</strong> {pendiente.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</p></div>}
    </section>
  );
}
