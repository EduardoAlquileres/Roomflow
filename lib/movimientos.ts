import { supabase } from "@/lib/supabase";

export interface MovimientoCobro {
  id: string;
  cobro_id: string;
  fecha: string;
  importe: number;
  metodo: string | null;
  observaciones: string | null;
  created_at: string;
}

/**
 * Obtener movimientos de un cobro
 */
export async function obtenerMovimientos(
  cobroId: string
): Promise<MovimientoCobro[]> {
  const { data, error } = await supabase
    .from("movimientos_cobro")
    .select("*")
    .eq("cobro_id", cobroId)
    .order("fecha", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

/**
 * Obtener un movimiento
 */
export async function obtenerMovimiento(
  id: string
): Promise<MovimientoCobro | null> {
  const { data, error } = await supabase
    .from("movimientos_cobro")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
}

/**
 * Crear movimiento
 */
export async function crearMovimiento(
  movimiento: Omit<MovimientoCobro, "id" | "created_at">
): Promise<MovimientoCobro> {
  const { data, error } = await supabase
    .from("movimientos_cobro")
    .insert(movimiento)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Actualizar movimiento
 */
export async function actualizarMovimiento(
  id: string,
  movimiento: Partial<Omit<MovimientoCobro, "id" | "created_at">>
): Promise<MovimientoCobro> {
  const { data, error } = await supabase
    .from("movimientos_cobro")
    .update(movimiento)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Eliminar movimiento
 */
export async function eliminarMovimiento(id: string): Promise<void> {
  const { error } = await supabase
    .from("movimientos_cobro")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/**
 * Calcular importe pagado de un cobro
 */
export async function calcularPagado(cobroId: string): Promise<number> {
  const movimientos = await obtenerMovimientos(cobroId);

  return movimientos.reduce(
    (total, movimiento) => total + movimiento.importe,
    0
  );
}