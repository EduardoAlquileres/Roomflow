import { supabase } from "@/lib/supabase";
import { Cobro } from "@/types/cobro";
import { Estancia } from "@/types/estancia";

type EstanciaActiva = Pick<Estancia, "inquilino_id" | "habitacion_id" | "fecha_entrada" | "precio" | "gastos" | "created_at">;
type InquilinoActivo = { id: string; habitacion_id: string; fecha_entrada: string; created_at: string };
type HabitacionEconomica = { id: string; precio: number; gastos: number };

type ResultadoGeneracionCobros = {
  creados: number;
  desde: string | null;
  hasta: string;
};

function fechaLocalHoy() {
  return new Date().toISOString().slice(0, 10);
}

function primerDiaMes(fecha: string) {
  const [anio, mes] = fecha.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(anio, mes - 1, 1));
}

function clavePeriodo(habitacionId: string, fecha: Date) {
  return `${habitacionId}-${fecha.getUTCFullYear()}-${fecha.getUTCMonth() + 1}`;
}

function sumarMes(fecha: Date) {
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth() + 1, 1));
}

function fechaVencimiento(periodo: Date, entrada: string) {
  const entradaMes = primerDiaMes(entrada);
  if (entradaMes.getTime() === periodo.getTime()) return entrada;
  return `${periodo.getUTCFullYear()}-${String(periodo.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

/**
 * Crea únicamente los meses que todavía no existen para las habitaciones con estancia activa.
 * El alquiler se cobra una vez por habitación y los gastos se multiplican por los titulares
 * que ya habían entrado en ese mes.
 */
export async function generarCobrosPendientes(hasta = fechaLocalHoy()): Promise<ResultadoGeneracionCobros> {
  const { data: estancias, error: errorEstancias } = await supabase
    .from("estancias")
    .select("inquilino_id, habitacion_id, fecha_entrada, precio, gastos, created_at")
    .eq("estado", "ACTIVA")
    .lte("fecha_entrada", hasta)
    .order("fecha_entrada")
    .order("created_at");
  if (errorEstancias) throw errorEstancias;

  const estanciasActivas = (estancias ?? []) as EstanciaActiva[];
  const habitacionesConEstancia = new Set(estanciasActivas.map((estancia) => estancia.habitacion_id));

  // Los inquilinos creados antes de implantar el historial pueden no tener todavía
  // una estancia. Los incorporamos usando el precio y gastos actuales de su habitación.
  const { data: inquilinos, error: errorInquilinos } = await supabase
    .from("inquilinos")
    .select("id, habitacion_id, fecha_entrada, created_at")
    .eq("activo", true)
    .lte("fecha_entrada", hasta)
    .order("fecha_entrada")
    .order("created_at");
  if (errorInquilinos) throw errorInquilinos;

  const inquilinosSinEstancia = ((inquilinos ?? []) as InquilinoActivo[])
    .filter((inquilino) => !habitacionesConEstancia.has(inquilino.habitacion_id));
  const habitacionesIds = [...new Set(inquilinosSinEstancia.map((inquilino) => inquilino.habitacion_id))];
  const { data: habitaciones, error: errorHabitaciones } = habitacionesIds.length
    ? await supabase.from("habitaciones").select("id, precio, gastos").in("id", habitacionesIds)
    : { data: [], error: null };
  if (errorHabitaciones) throw errorHabitaciones;

  const importesPorHabitacion = new Map(
    ((habitaciones ?? []) as HabitacionEconomica[]).map((habitacion) => [habitacion.id, habitacion])
  );
  const activas = [
    ...estanciasActivas,
    ...inquilinosSinEstancia.flatMap((inquilino) => {
      const habitacion = importesPorHabitacion.get(inquilino.habitacion_id);
      return habitacion ? [{
        inquilino_id: inquilino.id,
        habitacion_id: inquilino.habitacion_id,
        fecha_entrada: inquilino.fecha_entrada,
        precio: habitacion.precio,
        gastos: habitacion.gastos,
        created_at: inquilino.created_at,
      }] : [];
    }),
  ];
  if (!activas.length) return { creados: 0, desde: null, hasta };

  const { data: cobrosExistentes, error: errorCobros } = await supabase
    .from("cobros")
    .select("habitacion_id, periodo_anio, periodo_mes");
  if (errorCobros) throw errorCobros;

  const existentes = new Set(
    (cobrosExistentes ?? []).map((cobro) => `${cobro.habitacion_id}-${cobro.periodo_anio}-${cobro.periodo_mes}`)
  );
  const porHabitacion = new Map<string, EstanciaActiva[]>();
  for (const estancia of activas) {
    const grupo = porHabitacion.get(estancia.habitacion_id) ?? [];
    grupo.push(estancia);
    porHabitacion.set(estancia.habitacion_id, grupo);
  }

  const limite = primerDiaMes(hasta);
  const nuevos: Omit<Cobro, "id" | "created_at">[] = [];
  let primerPeriodo: string | null = null;

  for (const [habitacionId, ocupantes] of porHabitacion) {
    const titular = ocupantes[0];
    for (let periodo = primerDiaMes(titular.fecha_entrada); periodo <= limite; periodo = sumarMes(periodo)) {
      const clave = clavePeriodo(habitacionId, periodo);
      if (existentes.has(clave)) continue;

      const ocupantesEnMes = ocupantes.filter((ocupante) => primerDiaMes(ocupante.fecha_entrada) <= periodo).length;
      if (!ocupantesEnMes) continue;

      const alquiler = Number(titular.precio);
      const gastos = Number(titular.gastos) * ocupantesEnMes;
      const total = alquiler + gastos;
      const anio = periodo.getUTCFullYear();
      const mes = periodo.getUTCMonth() + 1;
      nuevos.push({
        habitacion_id: habitacionId,
        inquilino_id: titular.inquilino_id,
        periodo_anio: anio,
        periodo_mes: mes,
        alquiler,
        gastos,
        total,
        pagado: 0,
        pendiente: total,
        estado: "PENDIENTE",
        fecha_vencimiento: fechaVencimiento(periodo, titular.fecha_entrada),
        observaciones: "Cobro mensual generado automáticamente.",
      });
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
