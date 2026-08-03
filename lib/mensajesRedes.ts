import { supabase } from "@/lib/supabase";
import { MensajeRed } from "@/types/mensaje-red";

function comprobar(error: { message?: string } | null) {
  if (error) throw new Error(error.message || "No se ha podido completar la operación con los mensajes.");
}

export async function obtenerMensajesRedes(): Promise<MensajeRed[]> {
  const { data, error } = await supabase.from("mensajes_redes").select("*").order("created_at", { ascending: false });
  comprobar(error);
  return (data ?? []) as MensajeRed[];
}

export async function crearMensajeRed(mensaje: Omit<MensajeRed, "id" | "created_at">) {
  const { data, error } = await supabase.from("mensajes_redes").insert(mensaje).select().single();
  comprobar(error);
  return data as MensajeRed;
}

export async function actualizarMensajeRed(id: string, cambios: Partial<Omit<MensajeRed, "id" | "created_at">>) {
  const { data, error } = await supabase.from("mensajes_redes").update(cambios).eq("id", id).select().single();
  comprobar(error);
  return data as MensajeRed;
}

export async function eliminarMensajeRed(id: string) {
  const { error } = await supabase.from("mensajes_redes").delete().eq("id", id);
  comprobar(error);
}
