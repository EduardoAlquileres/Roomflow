import {
  buscarInquilinoPorDocumento,
  crearInquilino,
  actualizarInquilino,
} from "./inquilinos";

import {
  obtenerHabitacion,
  actualizarEstadoHabitacion,
} from "./habitaciones";

import {
  crearCobro,
} from "./cobros";
import { crearEstancia } from "./estancias";
import { registrarFianza } from "./fianzas";
import { generarCobrosPendientes } from "./generarCobrosPendientes";
import { factorProrrateoEntrada, fechaVencimientoPeriodo } from "./estanciasCobros";

import {
  Inquilino,
  Cobro,
} from "@/types";

type DatosNuevoInquilino = Omit<
  Inquilino,
  | "id"
  | "created_at"
  | "habitacion_id"
  | "fecha_entrada"
  | "fecha_salida"
  | "activo"
  | "observaciones"
>;

export interface CheckInInput {
  inquilino: DatosNuevoInquilino;
  habitacionId: string;
  fechaEntrada: string;
  fianza: number;
  observaciones?: string;
}

export interface CheckInResultado {
  inquilino: Inquilino;
  cobro: Cobro;
}

export async function buscarOCrearInquilino(
  datos: Omit<Inquilino, "id" | "created_at">
): Promise<Inquilino> {
  const existente = await buscarInquilinoPorDocumento(
    datos.documento
  );

  if (existente) {
    return await actualizarInquilino(existente.id, {
      habitacion_id: datos.habitacion_id,
      nombre: datos.nombre,
      apellidos: datos.apellidos,
      telefono: datos.telefono,
      email: datos.email,
      fecha_nacimiento: datos.fecha_nacimiento,
      nacionalidad: datos.nacionalidad,
      profesion: datos.profesion,
      empresa: datos.empresa,
      fecha_entrada: datos.fecha_entrada,
      fecha_salida: null,
      activo: true,
      observaciones: datos.observaciones,
    });
  }

  return crearInquilino(datos);
}

export async function realizarCheckIn(
  datos: CheckInInput
): Promise<CheckInResultado> {
  const habitacion = await obtenerHabitacion(
    datos.habitacionId
  );

  if (!habitacion) {
    throw new Error("La habitación no existe.");
  }

  if (habitacion.estado !== "LIBRE") {
    throw new Error("La habitación no está disponible.");
  }

  const inquilino = await buscarOCrearInquilino({
    ...datos.inquilino,
    habitacion_id: habitacion.id,
    fecha_entrada: datos.fechaEntrada,
    fecha_salida: null,
    activo: true,
    observaciones: datos.observaciones ?? null,
  });

  await actualizarEstadoHabitacion(
    habitacion.id,
    "OCUPADA"
  );

  const estancia = await crearEstancia({
    inquilino_id: inquilino.id,
    habitacion_id: habitacion.id,
    fecha_entrada: datos.fechaEntrada,
    fecha_salida: null,
    precio: habitacion.precio,
    gastos: habitacion.gastos,
    fianza: datos.fianza,
    estado: "ACTIVA",
    observaciones: datos.observaciones ?? null,
  });

  if (datos.fianza > 0) {
    await registrarFianza({
      estancia_id: estancia.id,
      inquilino_id: inquilino.id,
      habitacion_id: habitacion.id,
      importe: datos.fianza,
      fecha_cobro: datos.fechaEntrada,
      observaciones: datos.observaciones ?? null,
    });
  }

  const hoy = new Date(datos.fechaEntrada);

  const fechaEntrada = new Date(`${datos.fechaEntrada}T12:00:00`);
  const factorPrimerMes = factorProrrateoEntrada({
    id: "nueva-estancia", inquilino_id: inquilino.id, habitacion_id: habitacion.id,
    fecha_entrada: datos.fechaEntrada, fecha_salida: null, precio: habitacion.precio, gastos: habitacion.gastos,
    created_at: new Date().toISOString(),
  }, fechaEntrada.getFullYear(), fechaEntrada.getMonth() + 1);
  const alquilerPrimerMes = Number((habitacion.precio * factorPrimerMes).toFixed(2));
  const gastosPrimerMes = Number((habitacion.gastos * factorPrimerMes).toFixed(2));

  const cobro = await crearCobro({
    habitacion_id: habitacion.id,
    inquilino_id: inquilino.id,
    periodo_anio: hoy.getFullYear(),
    periodo_mes: hoy.getMonth() + 1,
    alquiler: alquilerPrimerMes,
    gastos: gastosPrimerMes,
    total: alquilerPrimerMes + gastosPrimerMes,
    pagado: 0,
    pendiente: alquilerPrimerMes + gastosPrimerMes,
    estado: "PENDIENTE",
    fecha_vencimiento: fechaVencimientoPeriodo(hoy.getFullYear(), hoy.getMonth() + 1),
    observaciones: null,
  });

  await generarCobrosPendientes();

  return {
    inquilino,
    cobro,
  };
}
