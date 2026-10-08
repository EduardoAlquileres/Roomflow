import { supabase } from "#roomflow-supabase";
import type { Cobro } from "@/types/cobro";

export type PagoAplazado = {
  id: string; cobro_id: string; importe_inicial: number; pagado_inicial: number;
  fecha_acuerdo: string; cuota_orientativa: number | null; proxima_fecha: string | null;
  notas: string; created_at: string;
};
export type CondicionesAplazamiento = {
  fecha_acuerdo: string; cuota_orientativa: number | null; proxima_fecha: string | null; notas: string;
};

export function resumenAplazamiento(acuerdo: PagoAplazado, cobro: Cobro) {
  const pendiente = Math.max(Number(cobro.pendiente), 0);
  const devuelto = Math.max(Math.round((Number(cobro.pagado) - Number(acuerdo.pagado_inicial)) * 100) / 100, 0);
  return { pendiente, devuelto, liquidado: pendiente < 0.005 };
}

export function validarEntrega(importe: number, pendiente: number) {
  if (!Number.isFinite(importe) || importe <= 0 || Math.abs(importe * 100 - Math.round(importe * 100)) > 0.000001) {
    throw new Error("Introduce un importe positivo con un máximo de dos decimales.");
  }
  if (importe > pendiente) throw new Error("El pago supera el saldo pendiente.");
}

export async function crearAplazamiento(cobroId: string, condiciones: CondicionesAplazamiento) {
  const { error } = await supabase.rpc("roomflow_crear_aplazamiento", {
    p_cobro_id: cobroId, p_fecha: condiciones.fecha_acuerdo,
    p_cuota: condiciones.cuota_orientativa, p_proxima_fecha: condiciones.proxima_fecha, p_notas: condiciones.notas,
  });
  if (error) throw error;
}

export async function editarAplazamiento(id: string, condiciones: CondicionesAplazamiento) {
  const { error } = await supabase.from("pagos_aplazados").update(condiciones).eq("id", id);
  if (error) throw error;
}

export async function registrarEntrega(datos: {
  acuerdoId: string; movimientoId: string; fecha: string; importe: number; metodo: string;
  observaciones: string; proximaFecha: string | null;
}, pendiente: number) {
  validarEntrega(datos.importe, pendiente);
  const { error } = await supabase.rpc("roomflow_pagar_aplazamiento", {
    p_acuerdo_id: datos.acuerdoId, p_movimiento_id: datos.movimientoId,
    p_fecha: datos.fecha, p_importe: datos.importe, p_metodo: datos.metodo,
    p_observaciones: datos.observaciones, p_proxima_fecha: datos.proximaFecha,
  });
  if (error) throw error;
}
