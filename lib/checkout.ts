import { actualizarEstadoHabitacion } from "./habitaciones";
import { actualizarInquilino } from "./inquilinos";
import { finalizarEstancia, obtenerEstanciaActivaPorInquilino } from "./estancias";
import { obtenerFianzaEstancia, registrarFianza, resolverFianza } from "./fianzas";

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
    let fianza = await obtenerFianzaEstancia(estancia.id);
    if (!fianza) {
      fianza = await registrarFianza({
        estancia_id: estancia.id,
        inquilino_id: inquilinoId,
        habitacion_id: habitacionId,
        importe: estancia.fianza,
        fecha_cobro: estancia.fecha_entrada,
        observaciones: "Fianza registrada al regularizar el check-out.",
      });
    }
    await resolverFianza(fianza.id, { fecha: fechaSalida, cumpleContrato, motivo: motivoRetencion, observaciones });
  }

  await actualizarInquilino(inquilinoId, {
    activo: false,
    fecha_salida: fechaSalida,
    observaciones: observaciones?.trim() || null,
  });

  await actualizarEstadoHabitacion(habitacionId, "LIBRE");

  if (estancia) await finalizarEstancia(estancia.id, fechaSalida);
}
