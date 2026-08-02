import { supabase } from "@/lib/supabase";
import { NuevoAlquiler } from "@/types/nuevoAlquiler";

type InquilinoGuardado = { id: string };

async function guardarInquilino(
  datos: NuevoAlquiler,
  persona: NuevoAlquiler["inquilino1"]
): Promise<InquilinoGuardado> {
  const valores = {
    nombre: persona.nombre.trim(),
    apellidos: persona.apellidos.trim(),
    documento: persona.dni.trim(),
    telefono: persona.telefono.trim(),
    email: persona.email.trim(),
    habitacion_id: datos.habitacionId,
    fecha_entrada: datos.fechaEntrada,
    fecha_salida: null,
    activo: true,
    observaciones: datos.observaciones.trim() || null,
  };

  const { data: existente, error: errorBusqueda } = await supabase
    .from("inquilinos")
    .select("id")
    .eq("documento", valores.documento)
    .order("activo", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (errorBusqueda) throw errorBusqueda;

  if (existente) {
    const { data, error } = await supabase
      .from("inquilinos")
      .update(valores)
      .eq("id", existente.id)
      .select("id")
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("inquilinos")
    .insert(valores)
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

async function crearEstanciaSiNoExiste(params: {
  inquilinoId: string;
  habitacionId: string;
  fechaEntrada: string;
  alquiler: number;
  gastos: number;
  fianza: number;
  observaciones: string;
}) {
  const { data: existente, error: errorBusqueda } = await supabase
    .from("estancias")
    .select("id")
    .eq("inquilino_id", params.inquilinoId)
    .eq("habitacion_id", params.habitacionId)
    .eq("estado", "ACTIVA")
    .limit(1)
    .maybeSingle();

  if (errorBusqueda) throw errorBusqueda;
  if (existente) return existente;

  const { data, error } = await supabase
    .from("estancias")
    .insert({
      inquilino_id: params.inquilinoId,
      habitacion_id: params.habitacionId,
      fecha_entrada: params.fechaEntrada,
      fecha_salida: null,
      precio: params.alquiler,
      gastos: params.gastos,
      fianza: params.fianza,
      estado: "ACTIVA",
      observaciones: params.observaciones.trim() || null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function crearNuevoAlquiler(datos: NuevoAlquiler) {
  const numeroInquilinos = datos.esPareja && datos.inquilino2 ? 2 : 1;
  const gastosPorPersona = Number(datos.gastos);
  const gastosTotales = gastosPorPersona * numeroInquilinos;
  const importeFianza = Math.max(Number(datos.fianza), datos.tipoInicio === "RESERVA" ? Number(datos.importeReserva) : 0);
  const importeEntregadoFianza = datos.tipoInicio === "RESERVA"
    ? Number(datos.importeReserva)
    : importeFianza;

  const { data: habitacion, error: errorHabitacion } = await supabase
    .from("habitaciones")
    .select("id, estado")
    .eq("id", datos.habitacionId)
    .single();

  if (errorHabitacion) throw errorHabitacion;
  if (habitacion.estado !== "LIBRE") {
    throw new Error("La habitación ya no está disponible.");
  }

  const inquilino1 = await guardarInquilino(datos, datos.inquilino1);
  const inquilino2 = datos.esPareja && datos.inquilino2
    ? await guardarInquilino(datos, datos.inquilino2)
    : null;

  const estancia1 = await crearEstanciaSiNoExiste({
    inquilinoId: inquilino1.id,
    habitacionId: datos.habitacionId,
    fechaEntrada: datos.fechaEntrada,
    alquiler: Number(datos.alquiler),
    gastos: gastosPorPersona,
    fianza: importeFianza,
    observaciones: datos.observaciones,
  });

  if (inquilino2) {
    await crearEstanciaSiNoExiste({
      inquilinoId: inquilino2.id,
      habitacionId: datos.habitacionId,
      fechaEntrada: datos.fechaEntrada,
      alquiler: Number(datos.alquiler),
      gastos: gastosPorPersona,
      fianza: 0,
      observaciones: datos.observaciones,
    });
  }

  if (importeFianza > 0) {
    const { data: fianzaExistente, error: errorFianzaBusqueda } = await supabase
      .from("fianzas")
      .select("id")
      .eq("estancia_id", estancia1.id)
      .limit(1)
      .maybeSingle();

    if (errorFianzaBusqueda) throw errorFianzaBusqueda;

    if (!fianzaExistente) {
      const { error } = await supabase.from("fianzas").insert({
        estancia_id: estancia1.id,
        inquilino_id: inquilino1.id,
        habitacion_id: datos.habitacionId,
        importe: importeFianza,
        importe_entregado: importeEntregadoFianza,
        fecha_cobro: datos.tipoInicio === "RESERVA"
          ? datos.fechaReserva || datos.fechaEntrada
          : datos.fechaEntrada,
        observaciones: datos.tipoInicio === "RESERVA"
          ? `Reserva entregada a cuenta de fianza: ${importeEntregadoFianza.toFixed(2)} €. ${datos.observaciones.trim()}`.trim()
          : datos.observaciones.trim() || null,
      });
      if (error) throw error;
    }
  }

  const fecha = new Date(`${datos.fechaEntrada}T12:00:00`);
  const total = Number(datos.alquiler) + gastosTotales;
  const { data: cobroExistente, error: errorCobroBusqueda } = await supabase
    .from("cobros")
    .select("id")
    .eq("habitacion_id", datos.habitacionId)
    .eq("inquilino_id", inquilino1.id)
    .eq("periodo_anio", fecha.getFullYear())
    .eq("periodo_mes", fecha.getMonth() + 1)
    .limit(1)
    .maybeSingle();

  if (errorCobroBusqueda) throw errorCobroBusqueda;

  let cobroId = cobroExistente?.id;
  if (!cobroId) {
    const { data, error } = await supabase
      .from("cobros")
      .insert({
        habitacion_id: datos.habitacionId,
        inquilino_id: inquilino1.id,
        periodo_anio: fecha.getFullYear(),
        periodo_mes: fecha.getMonth() + 1,
        alquiler: Number(datos.alquiler),
        gastos: gastosTotales,
        total,
        pagado: 0,
        pendiente: total,
        estado: "PENDIENTE",
        fecha_vencimiento: datos.fechaEntrada,
        observaciones: datos.observaciones.trim() || null,
      })
      .select("id")
      .single();

    if (error) throw error;
    cobroId = data.id;
  }

  const { error: errorEstado } = await supabase
    .from("habitaciones")
    .update({ estado: datos.tipoInicio === "RESERVA" ? "RESERVADA" : "OCUPADA" })
    .eq("id", datos.habitacionId);

  if (errorEstado) throw errorEstado;

  return { ok: true, inquilinoId: inquilino1.id, estanciaId: estancia1.id };
}
