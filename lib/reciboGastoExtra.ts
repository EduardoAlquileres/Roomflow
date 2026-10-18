import { supabase } from "#roomflow-supabase";
import type { Suplemento } from "@/types/suplemento";

export type DatosReciboGastoExtra = {
  gasto: Suplemento;
  vivienda: { nombre: string; direccion: string | null };
  habitacion: { codigo: string };
  inquilinos: { nombre: string; apellidos: string; documento: string | null }[];
  propietarios: { nombre_completo: string; documento: string | null }[];
  incluidoEnCobro: boolean;
  cobroLiquidado: boolean;
};
const escapar = (texto: string) => texto.replace(/[&<>'"]/g, caracter => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[caracter] ?? caracter);
const euros = (importe: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(importe);
const fecha = (valor: string) => new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${valor}T12:00:00`));

export function documentoGastoExtra(datos: DatosReciboGastoExtra, fechaEmision = new Date()) {
  const { gasto, vivienda, habitacion, inquilinos, propietarios } = datos;
  if (gasto.modalidad !== "PUNTUAL") throw new Error("El recibo individual corresponde a un gasto extra puntual.");
  if (!Number.isFinite(Number(gasto.importe)) || Number(gasto.importe) <= 0) throw new Error("El gasto no tiene un importe válido.");
  const titulares = inquilinos.map(persona => `${persona.nombre} ${persona.apellidos}${persona.documento ? ` (${persona.documento})` : ""}`).join(" · ") || "Titulares no disponibles";
  const arrendadores = propietarios.map(persona => `${persona.nombre_completo}${persona.documento ? ` (${persona.documento})` : ""}`).join(" · ");
  const estado = datos.incluidoEnCobro
    ? datos.cobroLiquidado ? "Incluido en el recibo mensual liquidado." : "Incluido en el recibo mensual. Su pago se controla junto con el alquiler."
    : "Cargo registrado, pendiente de incorporarse al recibo mensual correspondiente.";
  const emision = new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid" }).format(fechaEmision);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Recibo de gasto extra</title></head><body><div class="cabecera"><div class="titulo">RECIBO DE GASTO EXTRA</div><div class="meta">Referencia: GE-${escapar(gasto.id)}<br>Fecha de emisión: ${escapar(emision)}</div></div>${arrendadores ? `<div class="bloque"><div class="etiqueta">Propietario(s)</div><div class="valor">${escapar(arrendadores)}</div></div>` : ""}<div class="bloque"><div class="etiqueta">Inquilino(s)</div><div class="valor">${escapar(titulares)}</div></div><div class="bloque"><div class="etiqueta">Vivienda y habitación</div><div class="valor">${escapar(vivienda.nombre)}${vivienda.direccion ? `<br>${escapar(vivienda.direccion)}` : ""}<br>Habitación: ${escapar(habitacion.codigo)}</div></div><div class="bloque"><div class="etiqueta">Detalle del gasto extra</div><div class="valor">Fecha del gasto: ${escapar(fecha(gasto.fecha_inicio))}</div><div class="valor">Concepto: ${escapar(gasto.concepto)}</div><div class="fila total"><span>Importe del gasto extra</span><strong>${euros(Number(gasto.importe))}</strong></div></div><div class="bloque"><div class="etiqueta">Situación del cargo</div><div class="valor">${estado}</div></div><div class="nota">Este documento detalla exclusivamente este gasto extra puntual. No genera un segundo cargo ni se suma otra vez al alquiler.</div>${!datos.cobroLiquidado ? '<div class="nota">La emisión de este recibo no acredita que el gasto se haya pagado. Las entregas recibidas se registran en el cobro mensual correspondiente.</div>' : ""}</body></html>`;
}

/** Recupera el gasto guardado y los titulares de su contrato, incluso si ya salieron. */
export async function obtenerDatosGastoExtra(id: string): Promise<DatosReciboGastoExtra> {
  const gastoResultado = await supabase.from("suplementos_estancia").select("*").eq("id", id).single();
  if (gastoResultado.error) throw gastoResultado.error;
  const gasto = gastoResultado.data as Suplemento;
  if (gasto.modalidad !== "PUNTUAL") throw new Error("Los suplementos mensuales se detallan en el recibo de cada mes.");
  const estanciaResultado = await supabase.from("estancias").select("habitacion_id,fecha_entrada").eq("id", gasto.estancia_id).single();
  if (estanciaResultado.error) throw estanciaResultado.error;
  const estancia = estanciaResultado.data;
  const [habitacionResultado, grupoResultado, cobrosResultado] = await Promise.all([
    supabase.from("habitaciones").select("codigo,vivienda_id").eq("id", estancia.habitacion_id).single(),
    supabase.from("estancias").select("inquilino_id").eq("habitacion_id", estancia.habitacion_id).eq("fecha_entrada", estancia.fecha_entrada),
    supabase.from("cobros").select("pendiente,detalle_suplementos").eq("habitacion_id", estancia.habitacion_id).eq("periodo_anio", Number(gasto.fecha_inicio.slice(0, 4))).eq("periodo_mes", Number(gasto.fecha_inicio.slice(5, 7))),
  ]);
  const error = habitacionResultado.error ?? grupoResultado.error ?? cobrosResultado.error;
  if (error) throw error;
  const habitacion = habitacionResultado.data!;
  const ids = [...new Set((grupoResultado.data ?? []).map(item => item.inquilino_id))];
  const [viviendaResultado, personasResultado, titularesResultado] = await Promise.all([
    supabase.from("viviendas").select("nombre,direccion").eq("id", habitacion.vivienda_id).single(),
    ids.length ? supabase.from("inquilinos").select("nombre,apellidos,documento").in("id", ids) : Promise.resolve({ data: [], error: null }),
    supabase.from("vivienda_propietarios").select("propietario_id").eq("vivienda_id", habitacion.vivienda_id),
  ]);
  const errorPersonas = viviendaResultado.error ?? personasResultado.error ?? titularesResultado.error;
  if (errorPersonas) throw errorPersonas;
  const idsPropietarios = (titularesResultado.data ?? []).map(item => item.propietario_id);
  const propietariosResultado = idsPropietarios.length
    ? await supabase.from("propietarios").select("nombre_completo,documento").in("id", idsPropietarios)
    : { data: [], error: null };
  if (propietariosResultado.error) throw propietariosResultado.error;
  const cobros = (cobrosResultado.data ?? []).filter(item => (item.detalle_suplementos as { id: string }[] | null)?.some(detalle => detalle.id === gasto.id));
  return { gasto, vivienda: viviendaResultado.data!, habitacion, inquilinos: personasResultado.data ?? [], propietarios: propietariosResultado.data ?? [], incluidoEnCobro: cobros.length > 0, cobroLiquidado: cobros.length > 0 && cobros.every(cobro => Number(cobro.pendiente) <= 0) };
}
