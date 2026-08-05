import { CuotaFianza, Fianza } from "@/types";
import { supabase } from "./supabase";

export async function obtenerFianzas(): Promise<Fianza[]> {
  const { data, error } = await supabase
    .from("fianzas")
    .select("*")
    .order("fecha_cobro", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function obtenerCuotasFianzas(): Promise<CuotaFianza[]> {
  const { data, error } = await supabase.from("fianza_cuotas").select("*").order("fecha_prevista");
  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") return [];
    throw error;
  }
  return (data ?? []) as CuotaFianza[];
}

export async function registrarFianza(fianza: Omit<Fianza, "id" | "created_at" | "fecha_resolucion" | "estado" | "importe_devuelto" | "importe_retenido" | "motivo_retencion" | "importe_entregado"> & { importe_entregado?: number }): Promise<Fianza> {
  const { data, error } = await supabase.from("fianzas").insert({
    ...fianza,
    importe_entregado: fianza.importe_entregado ?? fianza.importe,
    estado: "COBRADA",
    importe_devuelto: 0,
    importe_retenido: 0,
    fecha_resolucion: null,
    motivo_retencion: null,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function obtenerFianzaEstancia(estanciaId: string): Promise<Fianza | null> {
  const { data, error } = await supabase.from("fianzas").select("*").eq("estancia_id", estanciaId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function resolverFianza(id: string, datos: { fecha: string; cumpleContrato: boolean; motivo?: string; observaciones?: string }): Promise<Fianza> {
  const { data: actual, error: errorActual } = await supabase.from("fianzas").select("importe, importe_entregado").eq("id", id).single();
  if (errorActual) throw errorActual;
  const cumpleContrato = datos.cumpleContrato;
  const { data, error } = await supabase.from("fianzas").update({
    estado: cumpleContrato ? "DEVUELTA" : "RETENIDA",
    fecha_resolucion: datos.fecha,
    importe_devuelto: cumpleContrato ? actual.importe_entregado : 0,
    importe_retenido: cumpleContrato ? 0 : actual.importe_entregado,
    motivo_retencion: cumpleContrato ? null : datos.motivo?.trim() || "Incumplimiento de contrato",
    observaciones: datos.observaciones?.trim() || null,
  }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
