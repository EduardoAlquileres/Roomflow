export interface MovimientoCobro {
  id: string;

  cobro_id: string;

  fecha: string;

  importe: number;

  metodo_pago:
    | "TRANSFERENCIA"
    | "EFECTIVO"
    | "BIZUM"
    | "TARJETA"
    | "OTRO";

  observaciones: string | null;

  created_at: string;
}