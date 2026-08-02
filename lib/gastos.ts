import { Gasto } from "@/types/gasto";
import { supabase } from "./supabase";

export async function obtenerGastos(): Promise<Gasto[]> {
  const { data, error } = await supabase.from("gastos").select("*").order("fecha", { ascending: false }).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function crearGastos(datos: Array<Omit<Gasto, "id" | "created_at" | "updated_at">>): Promise<Gasto[]> {
  // La agrupación se conserva en el concepto para mantener compatibilidad con
  // instalaciones que aún no tengan las columnas opcionales de prorrateo.
  const filas = datos.map((gasto) => {
    const fila = { ...gasto };
    delete fila.grupo_prorrateo;
    delete fila.es_prorrateado;
    return fila;
  });
  const { data, error } = await supabase.from("gastos").insert(filas).select();
  if (error) throw error;
  return data ?? [];
}
