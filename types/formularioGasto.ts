import { CategoriaGasto, MetodoPago } from "@/constants/gastos";

export interface FormularioGasto {
  fecha: string;
  vivienda_id: string;
  habitacion_id: string | null;

  categoria: CategoriaGasto;

  concepto: string;
  proveedor: string;

  importe: number;

  metodo_pago: MetodoPago | null;

  es_recurrente: boolean;

  periodicidad:
    | "MENSUAL"
    | "TRIMESTRAL"
    | "ANUAL"
    | null;

  estado:
    | "PENDIENTE"
    | "PAGADO"
    | "ANULADO";

  fecha_pago: string | null;

  origen:
    | "MANUAL"
    | "RECURRENTE";

  observaciones: string;

  documento: string | null;
}