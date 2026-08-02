import { supabase } from "./supabase";

export async function obtenerAlquilerActivo(habitacionId: string) {
  const { data, error } = await supabase
    .from("alquileres")
    .select(`
      *,
      alquiler_inquilinos(
        titular,
        inquilinos(*)
      )
    `)
    .eq("habitacion_id", habitacionId)
    .eq("estado", "ACTIVO")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw error;
  }

  return data;
}
