import { supabase } from "@/lib/supabase";
import { recalcularEstadoCobro } from "@/lib/cobros";

export type MovimientoCobro = {
  id: string;
  cobro_id: string;
  fecha: string;
  importe: number;
  metodo: string;
  observaciones: string | null;
  created_at: string;
};

export async function obtenerMovimientos(
  cobroId: string
): Promise<MovimientoCobro[]> {
  const { data, error } = await supabase
    .from("movimientos_cobro")
    .select("*")
    .eq("cobro_id", cobroId)
    .order("fecha", {
      ascending: true,
    });

  if (error) throw error;

  return (data ?? []) as MovimientoCobro[];
}

export async function crearMovimiento(
  movimiento: {
    cobro_id: string;
    fecha: string;
    importe: number;
    metodo: string;
    observaciones?: string;
  }
) {
  const { error } = await supabase
    .from("movimientos_cobro")
    .insert({
      cobro_id: movimiento.cobro_id,
      fecha: movimiento.fecha,
      importe: movimiento.importe,
      metodo: movimiento.metodo,
      observaciones:
        movimiento.observaciones ?? "",
    });

  if (error) throw error;
}

export async function eliminarMovimiento(
  id: string
) {
  const { error } = await supabase
    .from("movimientos_cobro")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function actualizarCobroDesdeMovimientos(
  cobroId: string
) {
  const movimientos =
    await obtenerMovimientos(cobroId);

  const totalPagado = movimientos.reduce(
    (suma, movimiento) =>
      suma + Number(movimiento.importe),
    0
  );

  const { data: cobro, error } =
    await supabase
      .from("cobros")
      .select("*")
      .eq("id", cobroId)
      .single();

  if (error) throw error;

  const pendiente =
    Number(cobro.total) - totalPagado;

  let estado = "PENDIENTE";

  if (pendiente <= 0) {
    estado = "PAGADO";
  } else if (totalPagado > 0) {
    estado = "PARCIAL";
  }

  const { error: updateError } =
    await supabase
      .from("cobros")
      .update({
        pagado: totalPagado,
        pendiente,
        estado,
      })
      .eq("id", cobroId);

  if (updateError) throw updateError;
}
export async function registrarPago(params: {
  cobroId: string;
  fecha: string;
  importe: number;
  metodo: string;
  observaciones?: string;
}) {
  await crearMovimiento({
    cobro_id: params.cobroId,
    fecha: params.fecha,
    importe: params.importe,
    metodo: params.metodo,
    observaciones: params.observaciones,
  });

  await actualizarCobroDesdeMovimientos(
    params.cobroId
  );

  await recalcularEstadoCobro(
    params.cobroId
  );
}

export async function obtenerTotalPagado(
  cobroId: string
) {
  const movimientos =
    await obtenerMovimientos(cobroId);

  return movimientos.reduce(
    (total, movimiento) =>
      total + Number(movimiento.importe),
    0
  );
}

export async function existePago(
  cobroId: string
) {
  const movimientos =
    await obtenerMovimientos(cobroId);

  return movimientos.length > 0;
}

export async function obtenerUltimoPago(
  cobroId: string
): Promise<MovimientoCobro | null> {
  const movimientos =
    await obtenerMovimientos(cobroId);

  if (movimientos.length === 0) {
    return null;
  }

  return movimientos[
    movimientos.length - 1
  ];
}

export async function actualizarMovimiento(
  id: string,
  cambios: Pick<MovimientoCobro, "fecha" | "importe" | "metodo" | "observaciones">
) {
  const { error } = await supabase
    .from("movimientos_cobro")
    .update(cambios)
    .eq("id", id);

  if (error) throw error;
}
