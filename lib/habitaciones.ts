import { supabase } from "./supabase";
import { Habitacion } from "@/types";

/**
 * Obtener todas las habitaciones
 */
export async function obtenerHabitaciones(): Promise<Habitacion[]> {
  const { data, error } = await supabase
    .from("habitaciones")
    .select("*")
    .order("codigo");

  if (error) throw error;

  return data ?? [];
}

/**
 * Obtener una habitación por ID
 */
export async function obtenerHabitacion(id: string): Promise<Habitacion | null> {
  const { data, error } = await supabase
    .from("habitaciones")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
}

/**
 * Obtener habitaciones de una vivienda
 */
export async function obtenerHabitacionesPorVivienda(
  viviendaId: string
): Promise<Habitacion[]> {
  const { data, error } = await supabase
    .from("habitaciones")
    .select("*")
    .eq("vivienda_id", viviendaId)
    .order("codigo");

  if (error) throw error;

  return data ?? [];
}

/**
 * Crear habitación
 */
export async function crearHabitacion(
  habitacion: Omit<Habitacion, "id" | "created_at">
): Promise<Habitacion> {
  const { data, error } = await supabase
    .from("habitaciones")
    .insert(habitacion)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Actualizar habitación
 */
export async function actualizarHabitacion(
  id: string,
  habitacion: Partial<Omit<Habitacion, "id" | "created_at">>
): Promise<Habitacion> {
  const { data, error } = await supabase
    .from("habitaciones")
    .update(habitacion)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Actualizar únicamente el estado
 */
export async function actualizarEstadoHabitacion(
  id: string,
  estado: Habitacion["estado"]
): Promise<void> {
  const { error } = await supabase
    .from("habitaciones")
    .update({ estado })
    .eq("id", id);

  if (error) throw error;
}

/**
 * Eliminar habitación
 */
export async function eliminarHabitacion(id: string): Promise<void> {
  const { error } = await supabase
    .from("habitaciones")
    .delete()
    .eq("id", id);

  if (error) throw error;
}