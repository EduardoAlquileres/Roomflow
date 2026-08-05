"use client";

import { useState } from "react";

import {
  NuevoAlquiler,
  nuevoAlquilerInicial,
} from "@/types/nuevoAlquiler";

import PasoTipoInicio from "./PasoTipoInicio";
import PasoInquilinos from "./PasoInquilinos";
import PasoReserva from "./PasoReserva";
import PasoEntrada from "./PasoEntrada";
import PasoResumen from "./PasoResumen";

import { crearNuevoAlquiler } from "../../lib/crearNuevoAlquiler";
import { useRouter } from "next/navigation";

interface Props {
  viviendaId: string;
  habitacionId: string;
  habitacionCodigo?: string;
  viviendaNombre?: string;
  alquilerInicial?: number;
  gastosIniciales?: number;
  fianzaInicial?: number;
}

export default function NuevoAlquilerWizard({
  viviendaId,
  habitacionId,
  habitacionCodigo,
  viviendaNombre,
  alquilerInicial = 0,
  gastosIniciales = 0,
  fianzaInicial = 0,
}: Props) {

  const [datos, setDatos] = useState<NuevoAlquiler>({
    ...nuevoAlquilerInicial,
    viviendaId,
    habitacionId,
    alquiler: alquilerInicial,
    gastos: gastosIniciales,
    fianza: fianzaInicial,
    importeFianzaInicial: Number((fianzaInicial / 2).toFixed(2)),
    numeroCuotasFianza: 2,
  });

  const [paso, setPaso] = useState(0);
  const router = useRouter();

const [guardando, setGuardando] = useState(false);

  function siguiente() {
    if (paso === 0 && !datos.tipoInicio) { alert("Selecciona si es una reserva o una entrada directa."); return; }
    if (paso === 1 && (!datos.inquilino1.nombre.trim() || !datos.inquilino1.apellidos.trim() || !datos.inquilino1.dni.trim())) { alert("Completa nombre, apellidos y documento del primer inquilino."); return; }
    if (paso === 1 && datos.esPareja && (!datos.inquilino2?.nombre.trim() || !datos.inquilino2.apellidos.trim() || !datos.inquilino2.dni.trim())) { alert("Completa los datos del segundo inquilino."); return; }
    setPaso((p) => p + 1);
  }

  function anterior() {
    setPaso((p) => Math.max(0, p - 1));
  }

  
async function guardar() {

  if (guardando) return;

  try {

    setGuardando(true);

    const resultado =
      await crearNuevoAlquiler(datos);

    console.log(resultado);

    router.push(
      `/habitaciones/${habitacionId}`
    );

  } catch (error) {

    console.error(error);

    const detalle =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error && typeof error.message === "string"
          ? error.message
          : "";
    alert(detalle ? `No se ha podido crear el alquiler: ${detalle}` : "No se ha podido crear el alquiler.");

  } finally {

    setGuardando(false);

  }

}
  function progreso() {

    switch (paso) {

      case 0:
        return 25;

      case 1:
        return 50;

      case 2:
        return 75;

      default:
        return 100;

    }

  }

  return (

    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow" data-habitacion={habitacionCodigo ?? habitacionId}>

      <div className="border-b p-6">

        <h1 className="text-2xl font-bold">
          Nuevo alquiler
        </h1>

        <p className="text-gray-500 mt-1">
          Habitación {habitacionCodigo ?? habitacionId}
        </p>

        <div className="w-full h-2 bg-gray-200 rounded mt-6">

          <div
            className="bg-blue-600 h-2 rounded transition-all"
            style={{
              width: `${progreso()}%`,
            }}
          />

        </div>

      </div>

      <div className="p-6">

        {paso === 0 && (

          <PasoTipoInicio
            datos={datos}
            setDatos={setDatos}
          />

        )}

        {paso === 1 && (

          <PasoInquilinos
            datos={datos}
            setDatos={setDatos}
          />

        )}

        {paso === 2 &&
          datos.tipoInicio === "RESERVA" && (

            <PasoReserva
              datos={datos}
              setDatos={setDatos}
            />

          )}

        {paso === 2 &&
          datos.tipoInicio === "DIRECTO" && (

            <PasoEntrada
              datos={datos}
              setDatos={setDatos}
            />

          )}

        {paso === 3 && (

          <PasoResumen
            datos={datos}
            viviendaNombre={viviendaNombre}
            habitacionCodigo={habitacionCodigo}
          />

        )}

      </div>

      <div className="border-t p-6 flex justify-between">

        <button
          onClick={anterior}
          disabled={paso === 0}
          className="px-5 py-2 rounded bg-gray-200 disabled:opacity-50"
        >
          Anterior
        </button>

        {paso < 3 ? (

          <button
            onClick={siguiente}
            className="px-5 py-2 rounded bg-blue-600 text-white"
          >
            Siguiente
          </button>

        ) : (

          <button onClick={guardar} disabled={guardando} className="px-5 py-2 rounded bg-green-600 text-white disabled:bg-gray-400">
            {guardando ? "Guardando..." : datos.tipoInicio === "RESERVA" ? "Guardar reserva" : "Realizar Check-In"}
          </button>

        )}

      </div>

    </div>

  );

}
