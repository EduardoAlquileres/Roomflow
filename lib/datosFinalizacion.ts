import { supabase } from "#roomflow-supabase";
import { obtenerPropietarios, obtenerTitularesVivienda } from "./propietarios";
import { estanciaParaPeriodo } from "./estanciasCobros";
import { Estancia, Inquilino, Cobro, Fianza } from "@/types";
import type { DatosFinalizacion } from "./finalizacionPdf";

export async function obtenerDatosFinalizacion(estanciaId: string): Promise<DatosFinalizacion> {
  const { data: estancia, error } = await supabase.from("estancias").select("*").eq("id", estanciaId).single();
  if (error) throw new Error(error.message);
  if (estancia.estado !== "FINALIZADA" || !estancia.fecha_salida) throw new Error("Primero debes completar el check-out de esta estancia.");
  const { data: grupo, error: eGrupo } = await supabase.from("estancias").select("*").eq("habitacion_id", estancia.habitacion_id).eq("fecha_entrada", estancia.fecha_entrada).eq("fecha_salida", estancia.fecha_salida).eq("estado", "FINALIZADA");
  if (eGrupo) throw new Error(eGrupo.message);
  const ids = (grupo as Estancia[]).map(e => e.inquilino_id);
  const consultas = await Promise.all([
    supabase.from("habitaciones").select("*").eq("id", estancia.habitacion_id).single(),
    supabase.from("inquilinos").select("*").in("id", ids),
    supabase.from("fianzas").select("*").in("estancia_id", (grupo as Estancia[]).map(e => e.id)),
    supabase.from("cobros").select("*").eq("habitacion_id", estancia.habitacion_id).in("inquilino_id", ids),
    supabase.from("estancias").select("*").in("inquilino_id", ids),
  ]);
  for (const r of consultas) if (r.error) throw new Error(r.error.message);
  const habitacion = consultas[0].data;
  const { data: vivienda, error: eVivienda } = await supabase.from("viviendas").select("*").eq("id", habitacion.vivienda_id).single();
  if (eVivienda) throw new Error(eVivienda.message);
  const [propietarios, titularidades] = await Promise.all([obtenerPropietarios(), obtenerTitularesVivienda(vivienda.id)]);
  const euros = (n: number) => Number(n).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
  const fianzas = consultas[2].data as Fianza[];
  const fianza = fianzas.length ? fianzas.flatMap(f => [
    `Fianza entregada registrada: ${euros(f.importe_entregado)}. Estado: ${f.estado === "DEVUELTA" ? "devolución registrada" : f.estado === "RETENIDA" ? "retención registrada" : "pendiente de resolución"}.`,
    `Importe devuelto registrado: ${euros(f.importe_devuelto)}. Importe retenido registrado: ${euros(f.importe_retenido)}.`,
    ...(f.motivo_retencion ? ["Motivo registrado: " + f.motivo_retencion] : []),
  ]) : ["No consta una fianza vinculada a esta estancia. Completar, si procede: ____________________."];
  const idsEstancias = new Set((grupo as Estancia[]).map(e => e.id));
  const pendientes = (consultas[3].data as Cobro[]).filter(c => {
    const vigente = estanciaParaPeriodo(consultas[4].data as Estancia[], c.inquilino_id, c.periodo_anio, c.periodo_mes);
    return vigente && idsEstancias.has(vigente.id) && Number(c.pendiente) > 0;
  }).sort((a,b) => a.periodo_anio-b.periodo_anio || a.periodo_mes-b.periodo_mes).map(c => ({periodo:`${String(c.periodo_mes).padStart(2,"0")}/${c.periodo_anio}`, importe:Number(c.pendiente)}));
  return { vivienda: vivienda.direccion || vivienda.nombre, habitacion: habitacion.codigo, entrada: estancia.fecha_entrada, salida: estancia.fecha_salida,
    propietarios: propietarios.filter(p => titularidades.some(t => t.propietario_id === p.id)).map(p => `${p.nombre_completo} · ${p.documento || "Documento sin indicar"}`),
    titulares: (consultas[1].data as Inquilino[]).map(i => `${i.nombre} ${i.apellidos || ""} · ${i.documento || "Documento sin indicar"}`),
    fianza, pendientes, observaciones: [...new Set(fianzas.map(f => f.observaciones).filter(Boolean))].join("\n") };
}
