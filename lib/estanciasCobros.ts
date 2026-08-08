import { Estancia } from "@/types/estancia";

export type EstanciaEconomica = Pick<
  Estancia,
  "id" | "inquilino_id" | "habitacion_id" | "fecha_entrada" | "fecha_salida" | "precio" | "gastos" | "created_at"
>;

export function inicioPeriodo(anio: number, mes: number) {
  return `${anio}-${String(mes).padStart(2, "0")}-01`;
}

export function finPeriodo(anio: number, mes: number) {
  return new Date(Date.UTC(anio, mes, 0)).toISOString().slice(0, 10);
}

function contieneFecha(estancia: EstanciaEconomica, fecha: string) {
  return estancia.fecha_entrada <= fecha && (!estancia.fecha_salida || estancia.fecha_salida >= fecha);
}

function solapaPeriodo(estancia: EstanciaEconomica, inicio: string, fin: string) {
  return estancia.fecha_entrada <= fin && (!estancia.fecha_salida || estancia.fecha_salida >= inicio);
}

/**
 * La mensualidad se asocia a la estancia que estaba vigente el día 1.
 * Si la entrada se produjo durante ese mes, se usa esa nueva estancia.
 */
export function estanciaParaPeriodo(estancias: EstanciaEconomica[], inquilinoId: string, anio: number, mes: number) {
  const inicio = inicioPeriodo(anio, mes);
  const fin = finPeriodo(anio, mes);
  const candidatas = estancias.filter((estancia) => estancia.inquilino_id === inquilinoId && solapaPeriodo(estancia, inicio, fin));
  const vigentesAlInicio = candidatas.filter((estancia) => contieneFecha(estancia, inicio));
  const ordenadas = (vigentesAlInicio.length ? vigentesAlInicio : candidatas)
    .sort((a, b) => `${b.fecha_entrada}-${b.created_at}`.localeCompare(`${a.fecha_entrada}-${a.created_at}`));
  return ordenadas[0] ?? null;
}

export function personasEnHabitacionPeriodo(estancias: EstanciaEconomica[], habitacionId: string, anio: number, mes: number) {
  const personas = new Set<string>();
  for (const estancia of estancias) {
    const vigente = estanciaParaPeriodo(estancias, estancia.inquilino_id, anio, mes);
    if (vigente?.habitacion_id === habitacionId) personas.add(estancia.inquilino_id);
  }
  return personas.size;
}

function redondearImporte(importe: number) {
  return Number(importe.toFixed(2));
}

/**
 * El primer mes se cobra únicamente por la parte del mes posterior a la entrada.
 * Ejemplo: entrada el día 15 de abril: 550 € pasan a ser 275 €.
 */
export function factorProrrateoEntrada(estancia: EstanciaEconomica, anio: number, mes: number) {
  const [anioEntrada, mesEntrada, diaEntrada] = estancia.fecha_entrada.slice(0, 10).split("-").map(Number);
  if (anioEntrada !== anio || mesEntrada !== mes || diaEntrada <= 1) return 1;

  const diasDelMes = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  return Math.max(0, (diasDelMes - diaEntrada) / diasDelMes);
}

export function importesCobroPeriodo(estancia: EstanciaEconomica, personas: number, anio: number, mes: number) {
  const factor = factorProrrateoEntrada(estancia, anio, mes);
  const alquiler = redondearImporte(Number(estancia.precio) * factor);
  const gastos = redondearImporte(Number(estancia.gastos) * personas * factor);
  return { alquiler, gastos, total: redondearImporte(alquiler + gastos), factor };
}
