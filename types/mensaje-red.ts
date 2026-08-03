export type CanalMensajeRed = "FACEBOOK" | "INSTAGRAM" | "WHATSAPP" | "TIKTOK" | "OTRO";
export type EstadoMensajeRed = "BORRADOR" | "LISTO" | "PUBLICADO" | "ARCHIVADO";

export interface MensajeRed {
  id: string;
  canal: CanalMensajeRed;
  tipo: "ANUNCIO" | "RESPUESTA" | "SEGUIMIENTO";
  estado: EstadoMensajeRed;
  asunto: string;
  contenido: string;
  vivienda_id: string | null;
  habitacion_id: string | null;
  fecha_programada: string | null;
  publicado_en: string | null;
  enlace_publicacion: string | null;
  created_at: string;
}
