export interface Estancia {
  id: string;

  inquilino_id: string;

  habitacion_id: string;

  fecha_entrada: string;

  fecha_salida: string | null;

  precio: number;

  gastos: number;

  fianza: number;

  estado: "ACTIVA" | "FINALIZADA";

  observaciones: string | null;

  created_at: string;
}