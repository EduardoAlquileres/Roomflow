export interface Inquilino {
  id: string;
  habitacion_id: string;
  nombre: string;
  apellidos: string;
  documento: string;
  telefono: string;
  email: string;
  fecha_nacimiento: string | null;
  nacionalidad: string | null;
  profesion: string | null;
  empresa: string | null;
  fecha_entrada: string;
  fecha_salida: string | null;
  activo: boolean;
  empadronado?: boolean | null;
  empadronamiento_vivienda_id?: string | null;
  observaciones: string | null;
  created_at: string;
}
