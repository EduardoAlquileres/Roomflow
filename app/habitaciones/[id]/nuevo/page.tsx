import { notFound } from "next/navigation";

import { obtenerHabitacion } from "@/lib/habitaciones";
import { obtenerVivienda } from "@/lib/viviendas";
import NuevoAlquilerWizard from "@/components/alquiler/NuevoAlquilerWizard";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function NuevoAlquilerPage({
  params,
}: Props) {
  const { id } = await params;

  const habitacion = await obtenerHabitacion(id);

  if (!habitacion) {
    notFound();
  }

  const vivienda = await obtenerVivienda(habitacion.vivienda_id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Nuevo alquiler
        </h1>

        <p className="text-gray-500">
          Habitación {habitacion.codigo}
        </p>
      </div>

      <NuevoAlquilerWizard viviendaId={habitacion.vivienda_id} habitacionId={habitacion.id} habitacionCodigo={habitacion.codigo} viviendaNombre={vivienda?.nombre} alquilerInicial={habitacion.precio} gastosIniciales={habitacion.gastos} fianzaInicial={habitacion.precio * habitacion.fianza_meses} />
    </div>
  );
}
