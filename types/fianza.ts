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

export interface CuotaFianza {
  id: string;
  fianza_id: string;
  numero: number;
  fecha_prevista: string;
  importe: number;
  importe_pagado: number;
  fecha_pago: string | null;
  estado: "PENDIENTE" | "PAGADA";
  observaciones: string | null;
}
