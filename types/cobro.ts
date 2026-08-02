export type EstadoCobro =
  | "PENDIENTE"
  | "PARCIAL"
  | "PAGADO";

export interface Cobro {
  id: string;

  habitacion_id: string;

  inquilino_id: string;

  periodo_anio: number;

  periodo_mes: number;

  alquiler: number;

  gastos: number;

  total: number;

  pagado: number;

  pendiente: number;

  estado: EstadoCobro;

  fecha_vencimiento: string | null;

  observaciones: string | null;

  created_at: string;
}