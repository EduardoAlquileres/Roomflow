"use client";

import { NuevoAlquiler } from "@/types/nuevoAlquiler";

interface Props {
  datos: NuevoAlquiler;
  viviendaNombre?: string;
  habitacionCodigo?: string;
}

function fila(titulo: string, valor: string | number) {
  return (
    <div className="flex justify-between border-b py-2">
      <span className="font-medium">{titulo}</span>
      <span>{valor}</span>
    </div>
  );
}

export default function PasoResumen({ datos, viviendaNombre, habitacionCodigo }: Props) {
  const numeroInquilinos = datos.esPareja && datos.inquilino2 ? 2 : 1;
  const gastosTotales = Number(datos.gastos) * numeroInquilinos;
  return (
    <div className="space-y-8">

      <div>

        <h2 className="text-2xl font-bold">
          Resumen del alquiler
        </h2>

        <p className="text-gray-500">
          Revisa la información antes de guardar.
        </p>

      </div>

      <div className="border rounded-xl p-6 space-y-2">

        <h3 className="font-semibold text-lg">
          Habitación
        </h3>

        {fila("Vivienda", viviendaNombre ?? datos.viviendaId)}
        {fila("Habitación", habitacionCodigo ?? datos.habitacionId)}
        {fila("Tipo", datos.tipoInicio ?? "")}

      </div>

      <div className="border rounded-xl p-6 space-y-2">

        <h3 className="font-semibold text-lg">
          Inquilino principal
        </h3>

        {fila(
          "Nombre",
          `${datos.inquilino1.nombre} ${datos.inquilino1.apellidos}`
        )}

        {fila(datos.inquilino1.tipoDocumento, datos.inquilino1.dni)}
        {fila("Teléfono", datos.inquilino1.telefono)}
        {fila("Email", datos.inquilino1.email)}

      </div>

      {datos.inquilino2 && (

        <div className="border rounded-xl p-6 space-y-2">

          <h3 className="font-semibold text-lg">
            Segundo inquilino
          </h3>

          {fila(
            "Nombre",
            `${datos.inquilino2.nombre} ${datos.inquilino2.apellidos}`
          )}

          {fila(datos.inquilino2.tipoDocumento, datos.inquilino2.dni)}
          {fila("Teléfono", datos.inquilino2.telefono)}
          {fila("Email", datos.inquilino2.email)}

        </div>

      )}

      <div className="border rounded-xl p-6 space-y-2">

        <h3 className="font-semibold text-lg">
          Datos económicos
        </h3>

        {fila("Fecha entrada", fechaCorta(datos.fechaEntrada))}

        {datos.tipoInicio === "RESERVA" &&
          fila("Fecha reserva", fechaCorta(datos.fechaReserva))}

        {fila("Alquiler", `${datos.alquiler} €`)}
        {fila("Gastos por persona", `${datos.gastos} €`)}
        {fila(`Gastos totales (${numeroInquilinos} ${numeroInquilinos === 1 ? "persona" : "personas"})`, `${gastosTotales} €`)}
        {fila("Fianza", `${datos.fianza} €`)}

        {datos.tipoInicio === "RESERVA" &&
          fila("Reserva entregada", `${datos.importeReserva} €`)}

        {fila("Forma de pago", datos.metodoPago)}

      </div>

      <div className="border rounded-xl bg-green-50 border-green-300 p-6">

        <h3 className="font-bold mb-4">
          Al guardar se realizará automáticamente
        </h3>

        <ul className="space-y-2">

          <li>✓ Crear el inquilino</li>

          {datos.inquilino2 &&
            <li>✓ Crear el segundo inquilino</li>}

          <li>✓ Cambiar el estado de la habitación</li>

          <li>✓ Crear el alquiler</li>

          {datos.tipoInicio === "RESERVA" &&
            <li>✓ Registrar la reserva</li>}

          <li>✓ Registrar el primer movimiento económico</li>

        </ul>

      </div>

    </div>
  );
}

function fechaCorta(valor: string) {
  if (!valor) return "—";

  const fecha = new Date(`${valor}T12:00:00`);
  if (Number.isNaN(fecha.getTime())) return valor;

  const mes = new Intl.DateTimeFormat("es-ES", { month: "short" })
    .format(fecha)
    .replace(".", "");

  return `${String(fecha.getDate()).padStart(2, "0")}-${mes}-${fecha.getFullYear()}`;
}
