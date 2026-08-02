"use client";

import { NuevoAlquiler, TipoInicio } from "@/types/nuevoAlquiler";

interface Props {
  datos: NuevoAlquiler;
  setDatos: React.Dispatch<React.SetStateAction<NuevoAlquiler>>;
}

export default function PasoTipoInicio({
  datos,
  setDatos,
}: Props) {

  function seleccionar(tipo: TipoInicio) {
    setDatos((prev) => ({
      ...prev,
      tipoInicio: tipo,
    }));
  }

  function tarjeta(
    titulo: string,
    descripcion: string,
    tipo: TipoInicio
  ) {

    const activa = datos.tipoInicio === tipo;

    return (
      <button
        type="button"
        onClick={() => seleccionar(tipo)}
        className={`
          w-full
          rounded-xl
          border-2
          p-6
          text-left
          transition-all

          ${
            activa
              ? "border-blue-600 bg-blue-50"
              : "border-gray-200 hover:border-blue-300"
          }
        `}
      >
        <h2 className="text-xl font-semibold">
          {titulo}
        </h2>

        <p className="text-gray-600 mt-2">
          {descripcion}
        </p>
      </button>
    );
  }

  return (

    <div className="space-y-6">

      <div>

        <h2 className="text-2xl font-bold">
          ¿Cómo comienza este alquiler?
        </h2>

        <p className="text-gray-500 mt-2">
          Selecciona el tipo de entrada.
        </p>

      </div>

      {tarjeta(
        "Reserva",
        "El inquilino reserva hoy la habitación y entrará más adelante.",
        "RESERVA"
      )}

      {tarjeta(
        "Entrada directa",
        "El inquilino entra hoy mismo en la habitación.",
        "DIRECTO"
      )}

    </div>

  );

}