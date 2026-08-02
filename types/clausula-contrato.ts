export type TipoClausulaContrato = "CONTRATO" | "RESERVA" | "AMBOS";

export interface ClausulaContrato {
  id: string;
  titulo: string;
  contenido: string;
  tipo_documento: TipoClausulaContrato;
  activa: boolean;
  orden: number;
  created_at: string;
}
