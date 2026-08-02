"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { realizarCheckOut } from "@/lib/checkout";

interface Props {
  inquilinoId: string;
  habitacionId: string;
  fechaEntrada: string;
}

export default function CheckOutForm({
  inquilinoId,
  habitacionId,
  fechaEntrada,
}: Props) {
  const router = useRouter();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [fechaSalida, setFechaSalida] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [observaciones, setObservaciones] = useState("");
  const [cumpleContrato, setCumpleContrato] = useState(true);
  const [motivoRetencion, setMotivoRetencion] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function confirmarSalida() {
    if (fechaSalida < fechaEntrada) {
      setError("La fecha de salida no puede ser anterior a la de entrada.");
      return;
    }

    if (!cumpleContrato && !motivoRetencion.trim()) {
      setError("Indica el motivo por el que se retiene la fianza.");
      return;
    }

    if (!window.confirm("¿Confirmas el Check-Out? La habitación quedará libre.")) {
      return;
    }

    try {
      setGuardando(true);
      setError("");
      await realizarCheckOut({
        inquilinoId,
        habitacionId,
        fechaSalida,
        observaciones,
        cumpleContrato,
        motivoRetencion,
      });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo realizar el Check-Out.");
    } finally {
      setGuardando(false);
    }
  }

  if (!mostrarFormulario) {
    return (
      <button
        type="button"
        onClick={() => setMostrarFormulario(true)}
        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
      >
        Realizar Check-Out
      </button>
    );
  }

  return (
    <div className="mt-6 rounded-lg border border-red-100 bg-red-50 p-4">
      <h3 className="font-semibold text-gray-900">Confirmar salida</h3>
      <p className="mt-1 text-sm text-gray-600">
        Al confirmar, el inquilino quedará inactivo y la habitación pasará a estar libre.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-gray-700">
          Fecha de salida
          <input
            type="date"
            min={fechaEntrada}
            value={fechaSalida}
            onChange={(event) => setFechaSalida(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Observaciones de salida
          <input
            value={observaciones}
            onChange={(event) => setObservaciones(event.target.value)}
            placeholder="Opcional"
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2"
          />
        </label>
      </div>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-gray-800">Resolucion de la fianza</legend>
        <p className="mt-1 text-sm text-gray-600">La fianza se gestiona por separado y nunca se suma a los ingresos de alquiler.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className={`cursor-pointer rounded-lg border p-3 ${cumpleContrato ? "border-green-400 bg-green-50" : "border-gray-200 bg-white"}`}>
            <input type="radio" checked={cumpleContrato} onChange={() => setCumpleContrato(true)} className="mr-2" />
            <span className="font-semibold text-green-800">Devuelve la fianza</span>
            <span className="mt-1 block text-xs text-gray-600">Cumplimiento del contrato.</span>
          </label>
          <label className={`cursor-pointer rounded-lg border p-3 ${!cumpleContrato ? "border-amber-400 bg-amber-50" : "border-gray-200 bg-white"}`}>
            <input type="radio" checked={!cumpleContrato} onChange={() => setCumpleContrato(false)} className="mr-2" />
            <span className="font-semibold text-amber-800">Retiene la fianza</span>
            <span className="mt-1 block text-xs text-gray-600">Compensacion de gastos o incumplimientos; no es renta.</span>
          </label>
        </div>
        {!cumpleContrato && <label className="mt-3 block text-sm font-medium text-gray-700">Motivo de la retencion<textarea value={motivoRetencion} onChange={(event) => setMotivoRetencion(event.target.value)} rows={3} placeholder="Ej.: desperfectos, salida sin aviso..." className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2" /></label>}
      </fieldset>

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

      <div className="mt-4 flex justify-end gap-3">
        <button
          type="button"
          disabled={guardando}
          onClick={() => {
            setMostrarFormulario(false);
            setError("");
          }}
          className="rounded-lg border bg-white px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={guardando || !fechaSalida}
          onClick={confirmarSalida}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {guardando ? "Finalizando..." : "Confirmar Check-Out"}
        </button>
      </div>
    </div>
  );
}
