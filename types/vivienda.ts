export interface Vivienda {
  id: string;
  nombre: string;
  direccion: string;
  activa: boolean;
  municipio?: string | null;
  referencia_catastral?: string | null;
  entidad_bancaria?: string | null;
  iban_cobro?: string | null;
  suministros_contrato?: string | null;
  created_at: string;
}
