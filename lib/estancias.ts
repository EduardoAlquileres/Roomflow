import { supabase } from "./supabase";
import { Estancia } from "@/types";

/**
 * Obtener todas las estancias
 */
export async function obtenerEstancias(): Promise<Estancia[]> {
  const { data, error } = await supabase
    .from("estancias")
    .select("*")
    .order("fecha_entrada", { ascending: false });

  if (error) throw error;

  return data ?? [];
}

/**
 * Obtener todas las estancias activas
 */
export async function obtenerEstanciasActivas(): Promise<Estancia[]> {
  const { data, error } = await supabase
    .from("estancias")
    .select("*")
    .eq("estado", "ACTIVA");

  if (error) throw error;

  return data ?? [];
}

/**
 * Obtener una estancia por ID
 */
export async function obtenerEstancia(
  id: string
): Promise<Estancia | null> {
  const { data, error } = await supabase
    .from("estancias")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
}

/**
 * Obtener la estancia activa de una habitación
 */
export async function obtenerEstanciaActivaPorHabitacion(
  habitacionId: string
): Promise<Estancia | null> {
  const { data, error } = await supabase
    .from("estancias")
    .select("*")
    .eq("habitacion_id", habitacionId)
    .eq("estado", "ACTIVA")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return data;
}

/**
 * Obtener la estancia activa de un inquilino
 */
export async function obtenerEstanciaActivaPorInquilino(
  inquilinoId: string
): Promise<Estancia | null> {
  const { data, error } = await supabase
    .from("estancias")
    .select("*")
    .eq("inquilino_id", inquilinoId)
    .eq("estado", "ACTIVA")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return data;
}

/**
 * Crear una estancia
 */
export async function crearEstancia(
  estancia: Omit<Estancia, "id" | "created_at">
): Promise<Estancia> {
  const { data, error } = await supabase
    .from("estancias")
    .insert(estancia)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Corregir los datos de una estancia ya registrada.
 */
export async function actualizarEstancia(
  id: string,
  datos: Partial<Omit<Estancia, "id" | "created_at" | "inquilino_id" | "habitacion_id">>
): Promise<Estancia> {
  const { data, error } = await supabase
    .from("estancias")
    .update(datos)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Finalizar una estancia
 */
export async function finalizarEstancia(
  id: string,
  fechaSalida: string
): Promise<void> {
  const { error } = await supabase
    .from("estancias")
    .update({
      estado: "FINALIZADA",
      fecha_salida: fechaSalida,
    })
    .eq("id", id);

  if (error) throw error;
}

/**
 * Obtener historial de un inquilino
 */
export async function obtenerHistorialInquilino(
  inquilinoId: string
): Promise<Estancia[]> {
  const { data, error } = await supabase
    .from("estancias")
    .select("*")
    .eq("inquilino_id", inquilinoId)
    .order("fecha_entrada", { ascending: false });

  if (error) throw error;

  return data ?? [];
}

/**
 * Obtener historial de una habitación
 */
export async function obtenerHistorialHabitacion(
  habitacionId: string
): Promise<Estancia[]> {
  const { data, error } = await supabase
    .from("estancias")
    .select("*")
    .eq("habitacion_id", habitacionId)
    .order("fecha_entrada", { ascending: false });

  if (error) throw error;

  return data ?? [];
}

/**
 * Comprobar si una habitación está libre
 */
export async function habitacionDisponible(
  habitacionId: string
): Promise<boolean> {
  const estancia = await obtenerEstanciaActivaPorHabitacion(habitacionId);

  return estancia === null;
}

/**
 * Comprobar si un inquilino ya tiene una estancia activa
 */
export async function inquilinoDisponible(
  inquilinoId: string
): Promise<boolean> {
  const estancia = await obtenerEstanciaActivaPorInquilino(inquilinoId);

  return estancia === null;
}
