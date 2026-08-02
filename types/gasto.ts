import {
  CategoriaGasto,
  MetodoPago,
} from "@/constants/gastos";

export type EstadoGasto =
  | "PENDIENTE"
  | "PAGADO"
  | "ANULADO";

  export type OrigenGasto =
  | "MANUAL"
  | "RECURRENTE";

export interface Gasto {
  id: string;

  vivienda_id: string;
  habitacion_id: string | null;

  fecha: string;

  categoria: CategoriaGasto;

  concepto: string;

  proveedor: string | null;

  importe: number;

  metodo_pago: MetodoPago | null;

  es_recurrente: boolean;

  periodicidad:
    | "MENSUAL"
    | "TRIMESTRAL"
    | "ANUAL"
    | null;

  estado: EstadoGasto;

  origen: OrigenGasto;

  fecha_pago: string | null;

  observaciones: string | null;

  documento: string | null;

  grupo_prorrateo?: string | null;

  es_prorrateado?: boolean;

  created_at: string;

  updated_at: string;
}
