import { supabase } from "@/lib/supabase";
import { Cobro } from "@/types/cobro";
import { EstanciaEconomica, estanciaParaPeriodo, importesCobroPeriodo, personasEnHabitacionPeriodo } from "@/lib/estanciasCobros";

type ResultadoSincronizacion = { actualizados: number };

/**
 * Ajusta los cobros existentes a la estancia que corresponde a su mes.
 * Conserva los pagos ya anotados: solo recalcula alquiler, gastos, total y pendiente.
 */
export async function sincronizarCobrosHistoricos(): Promise<ResultadoSincronizacion> {
  const [{ data: cobrosData, error: errorCobros }, { data: estanciasData, error: errorEstancias }] = await Promise.all([
    supabase.from("cobros").select("*"),
    supabase.from("estancias").select("id, inquilino_id, habitacion_id, fecha_entrada, fecha_salida, precio, gastos, created_at"),
  ]);
  if (errorCobros) throw errorCobros;
  if (errorEstancias) throw errorEstancias;

  const cobros = (cobrosData ?? []) as Cobro[];
  const estancias = (estanciasData ?? []) as EstanciaEconomica[];
  let actualizados = 0;

  for (const cobro of cobros) {
    const estancia = estanciaParaPeriodo(estancias, cobro.inquilino_id, cobro.periodo_anio, cobro.periodo_mes);
    if (!estancia) continue;

    const personas = Math.max(1, personasEnHabitacionPeriodo(estancias, estancia.habitacion_id, cobro.periodo_anio, cobro.periodo_mes));
    const { alquiler, gastos, total } = importesCobroPeriodo(estancia, personas, cobro.periodo_anio, cobro.periodo_mes);
    const pagado = Number(cobro.pagado);
    const pendiente = Math.max(total - pagado, 0);
    const estado: Cobro["estado"] = pendiente === 0 ? "PAGADO" : pagado > 0 ? "PARCIAL" : "PENDIENTE";
    const hayCambios = cobro.habitacion_id !== estancia.habitacion_id
      || Number(cobro.alquiler) !== alquiler
      || Number(cobro.gastos) !== gastos
      || Number(cobro.total) !== total
      || Number(cobro.pendiente) !== pendiente
      || cobro.estado !== estado;
    if (!hayCambios) continue;

    const { error } = await supabase.from("cobros").update({
      habitacion_id: estancia.habitacion_id,
      alquiler,
      gastos,
      total,
      pendiente,
      estado,
    }).eq("id", cobro.id);
    if (error) throw error;
    actualizados += 1;
  }

  return { actualizados };
}
