"use client";

import { FileText } from "lucide-react";
import { descargarReciboPdf } from "@/lib/reciboPdf";
import { Cobro } from "@/types/cobro";
import { supabase } from "#roomflow-supabase";
import { EstanciaEconomica, estanciaParaPeriodo, estanciasDelContrato } from "@/lib/estanciasCobros";

type Props = {
  cobro: Cobro;
  vivienda: { id: string; nombre: string; direccion?: string | null } | null;
  habitacion: { codigo: string } | null;
  inquilino: { nombre: string; apellidos: string; documento?: string | null } | null;
};

type HabitacionDocumento = { id: string; codigo: string; vivienda_id: string; gastos: number };
type ViviendaDocumento = { id: string; nombre: string; direccion: string | null };
type Persona = { id: string; nombre: string; apellidos: string; documento: string };
type FianzaDocumento = { id: string; importe: number; importe_entregado: number };
type CuotaFianzaDocumento = { fecha_prevista: string; importe: number; importe_pagado: number };

const moneda = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const escapar = (texto: string) => texto.replace(/[&<>'"]/g, (caracter) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[caracter] ?? caracter);

export default function ReciboCobroButton({ cobro, vivienda, habitacion, inquilino }: Props) {
  async function generar() {
    const { data: estanciasData, error: errorEstancias } = await supabase
      .from("estancias")
      .select("id, inquilino_id, habitacion_id, fecha_entrada, fecha_salida, precio, gastos, created_at");
    if (errorEstancias) { alert(errorEstancias.message); return; }

    const estancias = (estanciasData ?? []) as EstanciaEconomica[];
    const estancia = estanciaParaPeriodo(estancias.filter((e) => e.habitacion_id === cobro.habitacion_id), cobro.inquilino_id, cobro.periodo_anio, cobro.periodo_mes);
    let viviendaRecibo = vivienda;
    let codigoHabitacion = habitacion?.codigo ?? "-";
    const alquiler = Number(cobro.alquiler);
    const gastos = Number(cobro.gastos);
    let titulares: Persona[] = [];
    const grupoEstancias = estancia ? estanciasDelContrato(estancias, estancia) : [];

    const habitacionId = estancia?.habitacion_id ?? cobro.habitacion_id;
    const { data: habitacionData, error: errorHabitacion } = await supabase
      .from("habitaciones").select("id, codigo, vivienda_id, gastos").eq("id", habitacionId).single();
    if (errorHabitacion) { alert(errorHabitacion.message); return; }
    const habitacionRecibo = habitacionData as HabitacionDocumento;
    codigoHabitacion = habitacionRecibo.codigo;

    if (estancia) {
      const { data: viviendaData, error: errorVivienda } = await supabase
        .from("viviendas").select("id, nombre, direccion").eq("id", habitacionRecibo.vivienda_id).single();
      if (errorVivienda) { alert(errorVivienda.message); return; }
      viviendaRecibo = viviendaData as ViviendaDocumento;
      const idsTitulares = [...new Set(grupoEstancias.map((item) => item.inquilino_id))];
      const { data: personasData, error: errorPersonas } = idsTitulares.length
        ? await supabase.from("inquilinos").select("id, nombre, apellidos, documento").in("id", idsTitulares)
        : { data: [], error: null };
      if (errorPersonas) { alert(errorPersonas.message); return; }
      titulares = (personasData ?? []) as Persona[];
    }

    if (!viviendaRecibo) { alert("No se ha encontrado la vivienda de este cobro."); return; }

    const { data: titularesVivienda, error: errorTitulares } = await supabase
      .from("vivienda_propietarios").select("propietario_id").eq("vivienda_id", viviendaRecibo.id);
    if (errorTitulares) { alert(errorTitulares.message); return; }
    const idsPropietarios = (titularesVivienda ?? []).map((titular) => titular.propietario_id);
    const { data: propietarios, error: errorPropietarios } = idsPropietarios.length
      ? await supabase.from("propietarios").select("id, nombre_completo, documento").in("id", idsPropietarios)
      : { data: [], error: null };
    if (errorPropietarios) { alert(errorPropietarios.message); return; }

    const listaPropietarios = (propietarios ?? []).map((propietario) => `${propietario.nombre_completo} (${propietario.documento})`).join(" · ") || "Propietario pendiente de asignar";
    const listaInquilinos = titulares.length
      ? titulares.map((titular) => `${titular.nombre} ${titular.apellidos} (${titular.documento || "Sin documento"})`).join(" · ")
      : inquilino ? `${inquilino.nombre} ${inquilino.apellidos} (${inquilino.documento || "Sin documento"})` : "Inquilino no disponible";

    const habitacionFianzaId = estancia?.habitacion_id ?? cobro.habitacion_id;
    const { data: fianzasData, error: errorFianzas } = grupoEstancias.length ? await supabase
      .from("fianzas").select("id, importe, importe_entregado")
      .eq("habitacion_id", habitacionFianzaId).in("estancia_id", grupoEstancias.map((e) => e.id)).eq("estado", "COBRADA")
      .order("created_at", { ascending: false }).limit(1) : { data: [], error: null };
    if (errorFianzas) { alert(errorFianzas.message); return; }
    const fianza = (fianzasData?.[0] ?? null) as FianzaDocumento | null;

    let cuotasPendientes: Array<CuotaFianzaDocumento & { pendiente: number }> = [];
    if (fianza) {
      const { data: cuotasData, error: errorCuotas } = await supabase
        .from("fianza_cuotas").select("fecha_prevista, importe, importe_pagado")
        .eq("fianza_id", fianza.id).order("fecha_prevista");
      if (errorCuotas) { alert(errorCuotas.message); return; }
      cuotasPendientes = ((cuotasData ?? []) as CuotaFianzaDocumento[])
        .map((cuota) => ({ ...cuota, pendiente: Math.max(Number(cuota.importe) - Number(cuota.importe_pagado), 0) }))
        .filter((cuota) => cuota.pendiente > 0.005);
    }
    const fianzaPendiente = fianza ? Math.max(Number(fianza.importe) - Number(fianza.importe_entregado), 0) : 0;
    const formatoFechaCuota = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" });
    const filasCuotasFianza = cuotasPendientes
      .map((cuota) => `<div class="fila"><span>Cuota pactada para ${escapar(formatoFechaCuota.format(new Date(`${cuota.fecha_prevista}T12:00:00`)))}</span><strong>${moneda.format(cuota.pendiente)}</strong></div>`)
      .join("");
    const bloqueFianza = fianzaPendiente > 0.005
      ? `<div class="bloque fianza"><div class="etiqueta">Fianza pendiente</div><div class="fila"><span>Importe pendiente de entregar</span><strong>${moneda.format(fianzaPendiente)}</strong></div>${filasCuotasFianza || '<div class="nota">Pendiente de acordar calendario de entregas.</div>'}</div>`
      : "";

    const total = Math.round((alquiler + gastos + Number(cobro.suplementos ?? 0)) * 100) / 100;
    const filasSuplementos = (cobro.detalle_suplementos ?? []).map((s) => `<div class="fila"><span>Suplemento: ${escapar(s.concepto)}</span><strong>${moneda.format(Number(s.importe))}</strong></div>`).join("");
    const pagado = Number(cobro.pagado);
    const pendiente = Math.max(total - pagado, 0);
    const mes = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(new Date(cobro.periodo_anio, cobro.periodo_mes - 1, 1));
    const fecha = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date());

    const documento = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Recibo ${cobro.periodo_mes}-${cobro.periodo_anio}</title></head><body><div class="cabecera"><div><div class="titulo">RECIBO DE PAGO</div><div class="meta" style="text-align:left">Recibo mensual de habitación</div></div><div class="meta">Fecha de emisión: ${fecha}<br>Periodo: ${escapar(mes)}</div></div><div class="bloque"><div class="etiqueta">Propietario(s)</div><div class="valor">${escapar(listaPropietarios)}</div></div><div class="bloque"><div class="etiqueta">Inquilino(s)</div><div class="valor">${escapar(listaInquilinos)}</div></div><div class="bloque"><div class="etiqueta">Vivienda y habitación</div><div class="valor">${escapar(viviendaRecibo.nombre)}${viviendaRecibo.direccion ? ` · ${escapar(viviendaRecibo.direccion)}` : ""}<br>Habitación: ${escapar(codigoHabitacion)}</div></div><div class="bloque"><div class="etiqueta">Desglose correspondiente a ${escapar(mes)}</div><div class="fila"><span>Alquiler de habitación</span><strong>${moneda.format(alquiler)}</strong></div><div class="fila"><span>Gastos facturados</span><strong>${moneda.format(gastos)}</strong></div>${filasSuplementos}<div class="fila total"><span>Total mensual</span><span>${moneda.format(total)}</span></div><div class="fila"><span>Importe recibido</span><strong>${moneda.format(pagado)}</strong></div><div class="fila"><span>Importe pendiente</span><strong>${moneda.format(pendiente)}</strong></div></div><div class="recordatorio">Recuerda que los pagos deben efectuarse entre los días 1 y 5 de cada mes.</div>${bloqueFianza}</body></html>`;

    descargarReciboPdf(documento, `Recibo-${cobro.periodo_mes}-${cobro.periodo_anio}.pdf`);
  }

  return <button style={{ width: 34, height: 34, border: "none", borderRadius: 6, background: "#eff6ff", color: "#2563eb", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Generar recibo" onClick={generar}><FileText size={18} /></button>;
}
