import { supabase } from "@/lib/supabase";
import { NuevoAlquiler } from "@/types/nuevoAlquiler";
import { generarCobrosPendientes } from "@/lib/generarCobrosPendientes";
import { factorProrrateoEntrada } from "@/lib/estanciasCobros";

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
  const importeFianza = Math.max(Number(datos.fianza), Number(datos.importeFianzaInicial));
  const importeEntregadoFianza = Math.min(importeFianza, Math.max(0, Number(datos.importeFianzaInicial)));

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

    let fianzaId = fianzaExistente?.id;
    if (!fianzaId) {
      const { data: fianzaCreada, error } = await supabase.from("fianzas").insert({
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
      }).select("id").single();
      if (error) throw error;
      fianzaId = fianzaCreada.id;
    }

    const { data: cuotasExistentes, error: errorBusquedaCuotas } = await supabase
      .from("fianza_cuotas")
      .select("id")
      .eq("fianza_id", fianzaId)
      .limit(1);
    if (errorBusquedaCuotas) throw errorBusquedaCuotas;
    if (!cuotasExistentes?.length) {
      const fechaBase = new Date(`${datos.fechaEntrada}T12:00:00`);
      const numeroCuotas = Math.max(1, Math.min(12, Number(datos.numeroCuotasFianza) || 1));
      const pendienteFianza = Math.max(importeFianza - importeEntregadoFianza, 0);
      const importePorCuota = Number((pendienteFianza / numeroCuotas).toFixed(2));
      const cuotas = [{
        fianza_id: fianzaId, numero: 1,
        fecha_prevista: datos.tipoInicio === "RESERVA" ? datos.fechaReserva || datos.fechaEntrada : datos.fechaEntrada,
        importe: importeEntregadoFianza, importe_pagado: importeEntregadoFianza,
        fecha_pago: importeEntregadoFianza > 0 ? (datos.tipoInicio === "RESERVA" ? datos.fechaReserva || datos.fechaEntrada : datos.fechaEntrada) : null,
        estado: importeEntregadoFianza > 0 ? "PAGADA" : "PENDIENTE",
      }];
      for (let indice = 0; indice < numeroCuotas; indice += 1) {
        const fechaCuota = new Date(fechaBase);
        fechaCuota.setMonth(fechaCuota.getMonth() + indice + 1);
        const importeCuota = indice === numeroCuotas - 1 ? Number((pendienteFianza - importePorCuota * (numeroCuotas - 1)).toFixed(2)) : importePorCuota;
        if (importeCuota > 0) cuotas.push({ fianza_id: fianzaId, numero: indice + 2, fecha_prevista: fechaCuota.toISOString().slice(0, 10), importe: importeCuota, importe_pagado: 0, fecha_pago: null, estado: "PENDIENTE" });
      }
      const { error: errorCuotas } = await supabase.from("fianza_cuotas").upsert(cuotas, { onConflict: "fianza_id,numero" });
      if (errorCuotas) throw errorCuotas;
    }
  }

  const fecha = new Date(`${datos.fechaEntrada}T12:00:00`);
  const factorPrimerMes = factorProrrateoEntrada({
    id: "nueva-estancia", inquilino_id: inquilino1.id, habitacion_id: datos.habitacionId,
    fecha_entrada: datos.fechaEntrada, fecha_salida: null, precio: Number(datos.alquiler), gastos: gastosPorPersona,
    created_at: new Date().toISOString(),
  }, fecha.getFullYear(), fecha.getMonth() + 1);
  const alquilerPrimerMes = Number((Number(datos.alquiler) * factorPrimerMes).toFixed(2));
  const gastosPrimerMes = Number((gastosTotales * factorPrimerMes).toFixed(2));
  const total = Number((alquilerPrimerMes + gastosPrimerMes).toFixed(2));
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
        alquiler: alquilerPrimerMes,
        gastos: gastosPrimerMes,
        total,
        pagado: 0,
        pendiente: total,
        estado: "PENDIENTE",
        fecha_vencimiento: datos.fechaEntrada,
        observaciones: datos.observaciones.trim() || null,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "42501" && error.message.includes("cobros")) {
        throw new Error("Supabase no tiene permiso para crear cobros. Ejecuta el archivo supabase/activar_escritura_cobros.sql una sola vez y vuelve a guardar el alquiler.");
      }
      throw error;
    }
    cobroId = data.id;
  }

  const { error: errorEstado } = await supabase
    .from("habitaciones")
    .update({ estado: datos.tipoInicio === "RESERVA" ? "RESERVADA" : "OCUPADA" })
    .eq("id", datos.habitacionId);

  if (errorEstado) throw errorEstado;

  await generarCobrosPendientes();

  return { ok: true, inquilinoId: inquilino1.id, estanciaId: estancia1.id };
}
