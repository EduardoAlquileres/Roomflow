import { supabase } from "@/lib/supabase";
import { Cobro } from "@/types/cobro";
import { EstanciaEconomica, estanciaParaPeriodo, importesCobroPeriodo, inicioPeriodo, personasEnHabitacionPeriodo } from "@/lib/estanciasCobros";

type InquilinoActivo = { id: string; habitacion_id: string; fecha_entrada: string; created_at: string };
type HabitacionEconomica = { id: string; precio: number; gastos: number };

type ResultadoGeneracionCobros = { creados: number; desde: string | null; hasta: string };

function fechaLocalHoy() {
  return new Date().toISOString().slice(0, 10);
}

function primerDiaMes(fecha: string) {
  const [anio, mes] = fecha.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(anio, mes - 1, 1));
}

function sumarMes(fecha: Date) {
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth() + 1, 1));
}

function clavePeriodo(estancia: EstanciaEconomica, anio: number, mes: number) {
  // Dos titulares que entran juntos comparten cobro, pero un cambio de
  // inquilino dentro del mismo mes debe generar una mensualidad diferente.
  return `${estancia.habitacion_id}-${anio}-${mes}-${estancia.fecha_entrada}`;
}

function fechaVencimiento(periodo: Date, entrada: string) {
  const entradaMes = primerDiaMes(entrada);
  if (entradaMes.getTime() === periodo.getTime()) return entrada;
  return inicioPeriodo(periodo.getUTCFullYear(), periodo.getUTCMonth() + 1);
}

/** Crea solo los cobros que faltan usando el precio y la habitación vigentes en cada mes. */
export async function generarCobrosPendientes(hasta = fechaLocalHoy()): Promise<ResultadoGeneracionCobros> {
  const { data, error: errorEstancias } = await supabase
    .from("estancias")
    .select("id, inquilino_id, habitacion_id, fecha_entrada, fecha_salida, precio, gastos, created_at")
    .lte("fecha_entrada", hasta)
    .order("fecha_entrada")
    .order("created_at");
  if (errorEstancias) throw errorEstancias;

  const estancias = (data ?? []) as EstanciaEconomica[];
  const inquilinosConEstancia = new Set(estancias.map((estancia) => estancia.inquilino_id));

  // Compatibilidad con inquilinos antiguos que todavía no tenían una estancia registrada.
  const { data: inquilinosData, error: errorInquilinos } = await supabase
    .from("inquilinos")
    .select("id, habitacion_id, fecha_entrada, created_at")
    .eq("activo", true)
    .lte("fecha_entrada", hasta);
  if (errorInquilinos) throw errorInquilinos;

  const inquilinosSinEstancia = ((inquilinosData ?? []) as InquilinoActivo[]).filter((inquilino) => !inquilinosConEstancia.has(inquilino.id));
  const habitacionesIds = [...new Set(inquilinosSinEstancia.map((inquilino) => inquilino.habitacion_id))];
  const { data: habitacionesData, error: errorHabitaciones } = habitacionesIds.length
    ? await supabase.from("habitaciones").select("id, precio, gastos").in("id", habitacionesIds)
    : { data: [], error: null };
  if (errorHabitaciones) throw errorHabitaciones;
  const importesPorHabitacion = new Map(((habitacionesData ?? []) as HabitacionEconomica[]).map((habitacion) => [habitacion.id, habitacion]));

  const todasLasEstancias: EstanciaEconomica[] = [
    ...estancias,
    ...inquilinosSinEstancia.flatMap((inquilino) => {
      const habitacion = importesPorHabitacion.get(inquilino.habitacion_id);
      return habitacion ? [{ id: `legado-${inquilino.id}`, inquilino_id: inquilino.id, habitacion_id: inquilino.habitacion_id, fecha_entrada: inquilino.fecha_entrada, fecha_salida: null, precio: habitacion.precio, gastos: habitacion.gastos, created_at: inquilino.created_at }] : [];
    }),
  ];
  if (!todasLasEstancias.length) return { creados: 0, desde: null, hasta };

  const { data: cobrosExistentes, error: errorCobros } = await supabase
    .from("cobros")
    .select("habitacion_id, inquilino_id, periodo_anio, periodo_mes");
  if (errorCobros) throw errorCobros;
  const existentes = new Set(
    (cobrosExistentes ?? []).flatMap((cobro) => {
      const estancia = estanciaParaPeriodo(
        todasLasEstancias,
        cobro.inquilino_id,
        cobro.periodo_anio,
        cobro.periodo_mes
      );
      return estancia ? [clavePeriodo(estancia, cobro.periodo_anio, cobro.periodo_mes)] : [];
    })
  );

  const limite = primerDiaMes(hasta);
  const inquilinos = [...new Set(todasLasEstancias.map((estancia) => estancia.inquilino_id))];
  const nuevos: Omit<Cobro, "id" | "created_at">[] = [];
  let primerPeriodo: string | null = null;

  for (const inquilinoId of inquilinos) {
    const estanciasInquilino = todasLasEstancias.filter((estancia) => estancia.inquilino_id === inquilinoId);
    const primeraEntrada = estanciasInquilino.reduce((menor, estancia) => estancia.fecha_entrada < menor ? estancia.fecha_entrada : menor, estanciasInquilino[0].fecha_entrada);
    for (let periodo = primerDiaMes(primeraEntrada); periodo <= limite; periodo = sumarMes(periodo)) {
      const anio = periodo.getUTCFullYear();
      const mes = periodo.getUTCMonth() + 1;
      const estancia = estanciaParaPeriodo(todasLasEstancias, inquilinoId, anio, mes);
      if (!estancia) continue;
      const clave = clavePeriodo(estancia, anio, mes);
      if (existentes.has(clave)) continue;

      const personas = Math.max(1, personasEnHabitacionPeriodo(todasLasEstancias, estancia.habitacion_id, anio, mes, estancia.fecha_entrada));
      const { alquiler, gastos, total } = importesCobroPeriodo(estancia, personas, anio, mes);
      nuevos.push({ habitacion_id: estancia.habitacion_id, inquilino_id: estancia.inquilino_id, periodo_mes: mes, periodo_anio: anio, alquiler, gastos, total, pagado: 0, pendiente: total, estado: "PENDIENTE", fecha_vencimiento: fechaVencimiento(periodo, estancia.fecha_entrada), observaciones: "Cobro mensual generado automáticamente según la estancia del periodo." });
      existentes.add(clave);
      const etiqueta = `${anio}-${String(mes).padStart(2, "0")}`;
      if (!primerPeriodo || etiqueta < primerPeriodo) primerPeriodo = etiqueta;
    }
  }

  if (nuevos.length) {
    const { error } = await supabase.from("cobros").insert(nuevos);
    if (error) throw error;
  }
  return { creados: nuevos.length, desde: primerPeriodo, hasta };
}
