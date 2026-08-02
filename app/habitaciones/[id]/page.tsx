import { notFound } from "next/navigation";

import { obtenerHabitacion } from "@/lib/habitaciones";
import { obtenerInquilinosHabitacion } from "@/lib/inquilinos";
import { obtenerCobrosHabitacion } from "@/lib/cobros";

import CheckOutForm from "@/components/CheckOutForm";
import EditarCheckInForm from "@/components/EditarCheckInForm";
import AnularCheckInButton from "@/components/AnularCheckInButton";
import DocumentoReservaButton from "@/components/DocumentoReservaButton";
import DocumentoContratoButton from "@/components/DocumentoContratoButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function HabitacionPage({
  params,
}: Props) {
  const { id } = await params;

  const habitacion = await obtenerHabitacion(id);

  if (!habitacion) {
    notFound();
  }

  const inquilinos = await obtenerInquilinosHabitacion(id);
  const inquilino = inquilinos[0] ?? null;

  const cobros = await obtenerCobrosHabitacion(id);
  return (
    <div className="space-y-8">

      <div className="rounded-xl border bg-white p-6">

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-3xl font-bold">
              Habitación {habitacion.codigo}
            </h1>

            <p className="text-gray-500">
              Estado: {habitacion.estado}
            </p>

          </div>

        </div>

      </div>      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        <div className="rounded-xl border bg-white p-6">

          <h2 className="mb-4 text-xl font-semibold">
            Datos de la habitación
          </h2>

          <div className="space-y-3">

            <div className="flex justify-between">
              <span>Código</span>
              <strong>{habitacion.codigo}</strong>
            </div>

            <div className="flex justify-between">
              <span>Estado</span>
              <strong>{habitacion.estado}</strong>
            </div>

            <div className="flex justify-between">
              <span>Precio</span>
              <strong>{habitacion.precio.toFixed(2)} €</strong>
            </div>

            <div className="flex justify-between">
              <span>Gastos</span>
              <strong>{habitacion.gastos.toFixed(2)} €</strong>
            </div>

            <div className="flex justify-between">
              <span>Fianza</span>
              <strong>{habitacion.fianza_meses} meses</strong>
            </div>

          </div>

        </div>

        <div className="rounded-xl border bg-white p-6 lg:col-span-2">

          <h2 className="mb-4 text-xl font-semibold">
            Titulares del contrato
          </h2>

          {!inquilino && (

  <div className="space-y-4">

    <p className="text-gray-500">
      La habitación está disponible.
    </p>

    <Link
      href={`/habitaciones/${habitacion.id}/nuevo`}
      className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-white"
    >
      Nuevo alquiler
    </Link>

  </div>

)}

          {inquilino && (

            <div className="space-y-3">

              <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
                Todos los titulares son responsables solidarios del contrato.
              </p>

              <div className="grid gap-3 md:grid-cols-2">
                {inquilinos.map((titular) => (
                  <div key={titular.id} className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Titular responsable</p>
                    <p className="mt-1 font-semibold text-slate-900">{titular.nombre} {titular.apellidos}</p>
                    <p className="mt-1 text-sm text-slate-600">{titular.documento}</p>
                    <p className="text-sm text-slate-600">{titular.telefono || "Sin teléfono"}</p>
                    <p className="text-sm text-slate-600">Entrada: {titular.fecha_entrada}</p>
                  </div>
                ))}
              </div>

              {habitacion.estado === "RESERVADA" && <DocumentoReservaButton habitacionId={habitacion.id} />}
              <DocumentoContratoButton habitacionId={habitacion.id} />

              <CheckOutForm
                inquilinoId={inquilino.id}
                habitacionId={habitacion.id}
                fechaEntrada={inquilino.fecha_entrada}
              />

              <AnularCheckInButton inquilinoId={inquilino.id} habitacionId={habitacion.id} nombreInquilino={`${inquilino.nombre} ${inquilino.apellidos}`} />

              <EditarCheckInForm
                inquilinoId={inquilino.id}
                habitacionId={habitacion.id}
                fechaEntrada={inquilino.fecha_entrada}
                observaciones={inquilino.observaciones}
                precio={habitacion.precio}
                gastos={habitacion.gastos}
              />

            </div>

          )}

        </div>

      </div>

      <div className="rounded-xl border bg-white p-6">

        <h2 className="mb-6 text-xl font-semibold">
          Cobros
        </h2>

        {cobros.length === 0 && (
          <p className="text-gray-500">
            No existen cobros para esta habitación.
          </p>
        )}

        {cobros.length > 0 && (

          <table className="w-full">

            <thead>

              <tr className="border-b">

                <th className="py-2 text-left">
                  Mes
                </th>

                <th className="py-2 text-right">
                  Total
                </th>

                <th className="py-2 text-right">
                  Pagado
                </th>

                <th className="py-2 text-right">
                  Pendiente
                </th>

                <th className="py-2 text-center">
                  Estado
                </th>

              </tr>

            </thead>

            <tbody>

              {cobros.map((cobro) => (

                <tr
                  key={cobro.id}
                  className="border-b"
                >

                  <td className="py-3">
  {cobro.periodo_mes}/{cobro.periodo_anio}
</td>

                  <td className="text-right">
                    {cobro.total.toFixed(2)} €
                  </td>

                  <td className="text-right">
                    {cobro.pagado.toFixed(2)} €
                  </td>

                  <td className="text-right">
                    {cobro.pendiente.toFixed(2)} €
                  </td>

                  <td className="text-center">
                    {cobro.estado}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        )}

      </div>

    </div>

  );

}
