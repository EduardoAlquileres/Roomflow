"use client";

import { NuevoAlquiler } from "@/types/nuevoAlquiler";

interface Props {
  datos: NuevoAlquiler;
  setDatos: React.Dispatch<React.SetStateAction<NuevoAlquiler>>;
}

export default function PasoEntrada({
  datos,
  setDatos,
}: Props) {

  function actualizar(
    campo: keyof NuevoAlquiler,
    valor: string | number
  ) {
    setDatos((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  function Campo(
    titulo: string,
    campo: keyof NuevoAlquiler,
    tipo = "text"
  ) {
    return (
      <div>
        <label className="block text-sm font-medium mb-1">
          {titulo}
        </label>

        <input
          type={tipo}
          value={String(datos[campo] ?? "")}
          onChange={(e) =>
            actualizar(
              campo,
              tipo === "number"
                ? Number(e.target.value)
                : e.target.value
            )
          }
          className="w-full border rounded-lg p-2"
        />
      </div>
    );
  }

  return (

    <div className="space-y-8">

      <div>

        <h2 className="text-2xl font-bold">
          Entrada directa
        </h2>

        <p className="text-gray-500">
          El inquilino entra hoy sin una reserva previa.
        </p>

      </div>

      <div className="grid md:grid-cols-2 gap-5">

        {Campo(
          "Fecha de entrada",
          "fechaEntrada",
          "date"
        )}

        {Campo(
          "Alquiler mensual (€)",
          "alquiler",
          "number"
        )}

        {Campo(
          "Gastos (€)",
          "gastos",
          "number"
        )}

        {Campo(
          "Fianza (€)",
          "fianza",
          "number"
        )}

      </div>

      <div>

        <label className="block text-sm font-medium mb-1">
          Método de pago
        </label>

        <select
          value={datos.metodoPago}
          onChange={(e) =>
            actualizar("metodoPago", e.target.value)
          }
          className="w-full border rounded-lg p-2"
        >
          <option value="">Seleccionar</option>
          <option value="EFECTIVO">Efectivo</option>
          <option value="BIZUM">Bizum</option>
          <option value="TRANSFERENCIA">Transferencia</option>
          <option value="TARJETA">Tarjeta</option>
        </select>

      </div>

      <div>

        <label className="block text-sm font-medium mb-1">
          Observaciones
        </label>

        <textarea
          rows={5}
          value={datos.observaciones}
          onChange={(e) =>
            actualizar("observaciones", e.target.value)
          }
          className="w-full border rounded-lg p-3"
        />

      </div>

    </div>

  );

}