export interface DocumentoInquilino {
  id: string;
  inquilino_id: string;
  nombre: string;
  ruta_archivo: string;
  tipo_archivo: string | null;
  tamano: number | null;
  created_at: string;
}
