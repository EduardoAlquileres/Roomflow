import { supabase } from "./supabase";

export type Propietario = { id: string; nombre_completo: string; documento: string };
export type Titularidad = { propietario_id: string; porcentaje: number };

export async function obtenerPropietarios(): Promise<Propietario[]> {
  const { data, error } = await supabase.from("propietarios").select("id, nombre_completo, documento").order("nombre_completo");
  if (error) throw error;
  return data ?? [];
}

export async function obtenerTitularesVivienda(viviendaId: string): Promise<Titularidad[]> {
  const { data, error } = await supabase.from("vivienda_propietarios").select("propietario_id, porcentaje").eq("vivienda_id", viviendaId);
  if (error) throw error;
  return (data ?? []).map((item) => ({ propietario_id: item.propietario_id, porcentaje: Number(item.porcentaje) }));
}
