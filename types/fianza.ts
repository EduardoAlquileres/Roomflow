export type EstadoFianza = "COBRADA" | "DEVUELTA" | "RETENIDA" | "PENDIENTE_REVISION";

export interface Fianza {
  id: string;
  estancia_id: string;
  inquilino_id: string;
  habitacion_id: string;
  importe: number;
  importe_entregado: number;
  fecha_cobro: string;
  estado: EstadoFianza;
  fecha_resolucion: string | null;
  importe_devuelto: number;
  importe_retenido: number;
  motivo_retencion: string | null;
  observaciones: string | null;
  created_at: string;
}
