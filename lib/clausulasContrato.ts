import { ClausulaContrato } from "@/types";
import { supabase } from "./supabase";

export async function obtenerClausulasContrato(): Promise<ClausulaContrato[]> {
  const { data, error } = await supabase.from("clausulas_contrato").select("*").order("orden").order("created_at");
  if (error) throw error;
  return data ?? [];
}
