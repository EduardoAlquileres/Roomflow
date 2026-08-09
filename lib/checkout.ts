import { actualizarEstadoHabitacion } from "./habitaciones";
import { actualizarInquilino } from "./inquilinos";
import { finalizarEstancia, obtenerEstanciasActivasPorHabitacion } from "./estancias";
import { obtenerFianzaEstancia, resolverFianza } from "./fianzas";

export interface CheckOutInput {
  inquilinoId: string;
  habitacionId: string;
  fechaSalida: string;
  observaciones?: string;
  cumpleContrato: boolean;
  motivoRetencion?: string;
}

/**
 * El alquiler pertenece a la habitación. Por ello, si hay dos titulares,
 * el check-out termina la estancia de ambos y deja la habitación libre.
 */
export async function realizarCheckOut({
  habitacionId,
  fechaSalida,
  observaciones,
  cumpleContrato,
  motivoRetencion,
}: CheckOutInput): Promise<void> {
  const estanciasActivas = await obtenerEstanciasActivasPorHabitacion(habitacionId);
  if (!estanciasActivas.length) {
    throw new Error("No hay una estancia activa para cerrar en esta habitación.");
  }

  // Puede haber dos titulares, pero hay una única fianza para el alquiler.
  // Solo se resuelve la fianza ya existente; jamás se crea una al hacer salida.
  const fianzas = await Promise.all(
    estanciasActivas.map((estancia) => obtenerFianzaEstancia(estancia.id))
  );
  const fianza = fianzas.find(Boolean);
  if (fianza?.estado === "COBRADA") {
    await resolverFianza(fianza.id, {
      fecha: fechaSalida,
      cumpleContrato,
      motivo: motivoRetencion,
      observaciones,
    });
  }

  await Promise.all(
    estanciasActivas.map(async (estancia) => {
      await actualizarInquilino(estancia.inquilino_id, {
        activo: false,
        fecha_salida: fechaSalida,
        observaciones: observaciones?.trim() || null,
      });
      await finalizarEstancia(estancia.id, fechaSalida);
    })
  );

  await actualizarEstadoHabitacion(habitacionId, "LIBRE");
}
