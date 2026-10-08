import type { Cobro } from "@/types/cobro";

export type FiltroEstadoCobro = "ABIERTOS" | "" | Cobro["estado"];

export function cobrosSinAplazamiento<T extends { id: string }>(cobros: T[], aplazados: ReadonlySet<string>) {
  return cobros.filter(cobro => !aplazados.has(cobro.id));
}

export function coincideEstadoCobro(cobro: Cobro, filtro: FiltroEstadoCobro, aplazados: ReadonlySet<string>) {
  if (filtro === "") return true; // El historial conserva el recibo original.
  if (aplazados.has(cobro.id) && Number(cobro.pendiente) > 0) return false;
  if (filtro === "ABIERTOS") return cobro.estado !== "PAGADO" && cobro.estado !== "DEUDA";
  return cobro.estado === filtro;
}

export function calcularResumenCobros(cobros: Cobro[], aplazados: ReadonlySet<string>) {
  const ordinarios = cobrosSinAplazamiento(cobros, aplazados);
  return {
    previstas: cobros.reduce((suma, cobro) => suma + Number(cobro.total), 0),
    cobradas: cobros.reduce((suma, cobro) => suma + Number(cobro.pagado), 0),
    pendientes: ordinarios.filter(cobro => cobro.estado !== "DEUDA").reduce((suma, cobro) => suma + Number(cobro.pendiente), 0),
    deudas: ordinarios.filter(cobro => cobro.estado === "DEUDA").reduce((suma, cobro) => suma + Number(cobro.pendiente), 0),
    aplazadas: cobros.filter(cobro => aplazados.has(cobro.id)).reduce((suma, cobro) => suma + Math.max(Number(cobro.pendiente), 0), 0),
    habitacionesPendientes: new Set(ordinarios.filter(cobro => cobro.estado !== "PAGADO" && cobro.estado !== "DEUDA").map(cobro => cobro.habitacion_id)).size,
  };
}
