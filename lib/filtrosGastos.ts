import type { Gasto } from "@/types/gasto";

export type FiltrosGastos = {
  viviendaId: string;
  categoria: string;
  tipo: string;
  mes: string;
  anio: string;
};

export const filtrosGastosIniciales: FiltrosGastos = {
  viviendaId: "", categoria: "", tipo: "", mes: "", anio: "",
};

export function filtrarGastos(gastos: Gasto[], filtros: FiltrosGastos) {
  return gastos.filter((gasto) => {
    if (filtros.viviendaId && gasto.vivienda_id !== filtros.viviendaId) return false;
    if (filtros.categoria && gasto.categoria !== filtros.categoria) return false;
    const prorrateado = Boolean(gasto.es_prorrateado || gasto.concepto.includes("(prorrateado)"));
    if (filtros.tipo === "propio" && prorrateado) return false;
    if (filtros.tipo === "prorrateado" && !prorrateado) return false;
    if (filtros.mes && gasto.fecha.slice(5, 7) !== filtros.mes) return false;
    if (filtros.anio && gasto.fecha.slice(0, 4) !== filtros.anio) return false;
    return true;
  });
}
