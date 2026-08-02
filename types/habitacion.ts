export type EstadoHabitacion =
  | "LIBRE"
  | "RESERVADA"
  | "OCUPADA";

export type TipoHabitacion =
  | "INDIVIDUAL"
  | "PAREJA";

export interface Habitacion {
  id: string;
  vivienda_id: string;

  codigo: string;

  tipo: TipoHabitacion;

  precio: number;

  gastos: number;

  fianza_meses: number;

  estado: EstadoHabitacion;

  disponible_desde: string | null;

  anuncio_facebook: string | null;
  anuncio_idealista: string | null;
  anuncio_fotocasa: string | null;

  observaciones: string | null;

  created_at: string;
}