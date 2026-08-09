import { actualizarEstadoHabitacion } from "./habitaciones";
import { actualizarInquilino } from "./inquilinos";
import { finalizarEstancia, obtenerEstanciaActivaPorInquilino, obtenerEstanciasActivasPorHabitacion } from "./estancias";
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
 * Cierra el alquiler activo y deja la habitación disponible de nuevo.
 */
export async function realizarCheckOut({
  inquilinoId,
  habitacionId,
  fechaSalida,
  observaciones,
  cumpleContrato,
  motivoRetencion,
}: CheckOutInput): Promise<void> {
  const estancia = await obtenerEstanciaActivaPorInquilino(inquilinoId);

  if (estancia && estancia.fianza > 0) {
    const fianza = await obtenerFianzaEstancia(estancia.id);
    if (fianza) {
      await resolverFianza(fianza.id, { fecha: fechaSalida, cumpleContrato, motivo: motivoRetencion, observaciones });
    }
  }

  await actualizarInquilino(inquilinoId, {
    activo: false,
    fecha_salida: fechaSalida,
    observaciones: observaciones?.trim() || null,
  });

  if (estancia) await finalizarEstancia(estancia.id, fechaSalida);

  const estanciasRestantes = await obtenerEstanciasActivasPorHabitacion(habitacionId);
  await actualizarEstadoHabitacion(habitacionId, estanciasRestantes.length ? "OCUPADA" : "LIBRE");
}
