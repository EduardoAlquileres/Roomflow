import { supabase } from "./supabase";
import { Vivienda } from "@/types";

/**
 * Obtener todas las viviendas
 */
export async function obtenerViviendas(): Promise<Vivienda[]> {
  const { data, error } = await supabase
    .from("viviendas")
    .select("*")
    .order("nombre");

  if (error) throw error;

  return data ?? [];
}

/**
 * Obtener una vivienda por ID
 */
export async function obtenerVivienda(id: string): Promise<Vivienda | null> {
  const { data, error } = await supabase
    .from("viviendas")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
}

/**
 * Crear vivienda
 */
export async function crearVivienda(
  vivienda: Omit<Vivienda, "id" | "created_at">
): Promise<Vivienda> {
  const { data, error } = await supabase
    .from("viviendas")
    .insert(vivienda)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Actualizar vivienda
 */
export async function actualizarVivienda(
  id: string,
  vivienda: Partial<Omit<Vivienda, "id" | "created_at">>
): Promise<Vivienda> {
  const { data, error } = await supabase
    .from("viviendas")
    .update(vivienda)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Eliminar vivienda
 */
export async function eliminarVivienda(id: string): Promise<void> {
  const { error } = await supabase
    .from("viviendas")
    .delete()
    .eq("id", id);

  if (error) throw error;
}