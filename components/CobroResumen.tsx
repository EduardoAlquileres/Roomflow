"use client";

interface CobroResumenProps {
  previsto: number;
  cobrado: number;
  pendiente: number;
  vencidos: number;
}

function formatoMoneda(valor: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(valor);
}

export default function CobroResumen({
  previsto,
  cobrado,
  pendiente,
  vencidos,
}: CobroResumenProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">Previsto</p>

        <h2 className="mt-2 text-3xl font-bold">
          {formatoMoneda(previsto)}
        </h2>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">Cobrado</p>

        <h2 className="mt-2 text-3xl font-bold text-green-600">
          {formatoMoneda(cobrado)}
        </h2>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">Pendiente</p>

        <h2 className="mt-2 text-3xl font-bold text-orange-600">
          {formatoMoneda(pendiente)}
        </h2>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">Vencidos</p>

        <h2 className="mt-2 text-3xl font-bold text-red-600">
          {vencidos}
        </h2>
      </div>
    </div>
  );
}