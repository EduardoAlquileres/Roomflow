import { supabase } from "./supabase";
import { Inquilino } from "@/types";

/**
 * Obtener todos los inquilinos
 */
export async function obtenerInquilinos(): Promise<Inquilino[]> {
  const { data, error } = await supabase
    .from("inquilinos")
    .select("*")
    .order("apellidos")
    .order("nombre");

  if (error) throw error;

  return data ?? [];
}

/**
 * Obtener un inquilino por ID
 */
export async function obtenerInquilino(
  id: string
): Promise<Inquilino | null> {
  const { data, error } = await supabase
    .from("inquilinos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;

  return data;
}

/**
 * Buscar por documento
 */
export async function buscarInquilinoPorDocumento(
  documento: string
): Promise<Inquilino | null> {
  const { data, error } = await supabase
    .from("inquilinos")
    .select("*")
    .ilike("documento", documento.trim())
    .order("activo", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return data;
}

/**
 * Buscar por habitación
 */
export async function obtenerInquilinoHabitacion(
  habitacionId: string
): Promise<Inquilino | null> {
  const { data, error } = await supabase
    .from("inquilinos")
    .select("*")
    .eq("habitacion_id", habitacionId)
    .eq("activo", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return data;
}

/** Obtener todos los titulares activos de una habitación. */
export async function obtenerInquilinosHabitacion(
  habitacionId: string
): Promise<Inquilino[]> {
  const { data, error } = await supabase
    .from("inquilinos")
    .select("*")
    .eq("habitacion_id", habitacionId)
    .eq("activo", true)
    .order("created_at", { ascending: true });

  if (error) throw error;
  const perfiles = new Map<string, Inquilino>();

  for (const inquilino of data ?? []) {
    const clave = inquilino.documento.trim().toUpperCase() || inquilino.id;
    const actual = perfiles.get(clave);

    if (!actual || (!actual.activo && inquilino.activo) || (actual.activo === inquilino.activo && inquilino.created_at > actual.created_at)) {
      perfiles.set(clave, inquilino);
    }
  }

  return [...perfiles.values()].sort((a, b) =>
    `${a.apellidos} ${a.nombre}`.localeCompare(`${b.apellidos} ${b.nombre}`, "es")
  );
}

/**
 * Crear inquilino
 */
export async function crearInquilino(
  datos: Omit<Inquilino, "id" | "created_at">
): Promise<Inquilino> {
  const { data, error } = await supabase
    .from("inquilinos")
    .insert(datos)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Actualizar inquilino
 */
export async function actualizarInquilino(
  id: string,
  datos: Partial<Omit<Inquilino, "id" | "created_at">>
): Promise<Inquilino> {
  const { data, error } = await supabase
    .from("inquilinos")
    .update(datos)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Activar / desactivar inquilino
 */
export async function actualizarEstadoInquilino(
  id: string,
  activo: boolean
): Promise<void> {
  const { error } = await supabase
    .from("inquilinos")
    .update({ activo })
    .eq("id", id);

  if (error) throw error;
}

/**
 * Eliminar inquilino
 */
export async function eliminarInquilino(
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("inquilinos")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
