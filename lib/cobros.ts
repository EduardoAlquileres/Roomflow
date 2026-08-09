import { supabase } from "@/lib/supabase";
import { Cobro } from "@/types/cobro";

export async function obtenerCobros(): Promise<Cobro[]> {
  const { data, error } = await supabase
    .from("cobros")
    .select("*")
    .order("periodo_anio", { ascending: false })
    .order("periodo_mes", { ascending: false });

  if (error) throw error;

  return (data ?? []) as Cobro[];
}

export async function obtenerCobro(
  id: string
): Promise<Cobro | null> {
  const { data, error } = await supabase
    .from("cobros")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data as Cobro;
}

export async function obtenerCobrosHabitacion(
  habitacionId: string
): Promise<Cobro[]> {
  const { data, error } = await supabase
    .from("cobros")
    .select("*")
    .eq("habitacion_id", habitacionId)
    .order("periodo_anio", { ascending: false })
    .order("periodo_mes", { ascending: false });

  if (error) throw error;

  return (data ?? []) as Cobro[];
}

export async function crearCobro(
  cobro: Omit<Cobro, "id" | "created_at">
): Promise<Cobro> {
  const { data, error } = await supabase
    .from("cobros")
    .insert(cobro)
    .select()
    .single();

  if (error) throw error;

  return data as Cobro;
}

export async function actualizarCobro(
  id: string,
  cambios: Partial<Cobro>
): Promise<Cobro> {
  const { data, error } = await supabase
    .from("cobros")
    .update(cambios)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data as Cobro;
}

export async function eliminarCobro(
  id: string
): Promise<void> {
  const { data, error } = await supabase
    .from("cobros")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) throw error;
  if (!data?.length) {
    throw new Error("No se ha podido borrar el cobro porque Supabase no tiene permiso de eliminación. Ejecuta el archivo supabase/permitir_eliminar_cobros.sql una sola vez.");
  }
}

export async function recalcularEstadoCobro(
  cobroId: string
): Promise<void> {
  const { data: cobro, error } = await supabase
    .from("cobros")
    .select("total")
    .eq("id", cobroId)
    .single();

  if (error) throw error;

  const { data: movimientos, error: errorMov } =
    await supabase
      .from("movimientos_cobro")
      .select("importe")
      .eq("cobro_id", cobroId);

  if (errorMov) throw errorMov;

  const pagado = (movimientos ?? []).reduce(
    (total, movimiento) =>
      total + Number(movimiento.importe),
    0
  );

  const pendiente = Number(cobro.total) - pagado;

  let estado: Cobro["estado"] = "PENDIENTE";

  if (pendiente <= 0) {
    estado = "PAGADO";
  } else if (pagado > 0) {
    estado = "PARCIAL";
  }

  const { error: updateError } = await supabase
    .from("cobros")
    .update({
      pagado,
      pendiente,
      estado,
    })
    .eq("id", cobroId);

  if (updateError) throw updateError;
}
