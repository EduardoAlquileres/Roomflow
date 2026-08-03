import { supabase } from "@/lib/supabase";
import { MensajeRed } from "@/types/mensaje-red";

export async function obtenerMensajesRedes(): Promise<MensajeRed[]> {
  const { data, error } = await supabase.from("mensajes_redes").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MensajeRed[];
}

export async function crearMensajeRed(mensaje: Omit<MensajeRed, "id" | "created_at">) {
  const { data, error } = await supabase.from("mensajes_redes").insert(mensaje).select().single();
  if (error) throw error;
  return data as MensajeRed;
}

export async function actualizarMensajeRed(id: string, cambios: Partial<Omit<MensajeRed, "id" | "created_at">>) {
  const { data, error } = await supabase.from("mensajes_redes").update(cambios).eq("id", id).select().single();
  if (error) throw error;
  return data as MensajeRed;
}

export async function eliminarMensajeRed(id: string) {
  const { error } = await supabase.from("mensajes_redes").delete().eq("id", id);
  if (error) throw error;
}
