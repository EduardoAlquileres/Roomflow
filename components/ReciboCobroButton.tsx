"use client";

import { FileText } from "lucide-react";
import { Cobro } from "@/types/cobro";
import { supabase } from "@/lib/supabase";
import { EstanciaEconomica, estanciaParaPeriodo, personasEnHabitacionPeriodo } from "@/lib/estanciasCobros";

type Props = {
  cobro: Cobro;
  vivienda: { id: string; nombre: string; direccion?: string | null } | null;
  habitacion: { codigo: string } | null;
  inquilino: { nombre: string; apellidos: string } | null;
};

type HabitacionDocumento = { id: string; codigo: string; vivienda_id: string };
type ViviendaDocumento = { id: string; nombre: string; direccion: string | null };
type Persona = { id: string; nombre: string; apellidos: string };
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
    const estancia = estanciaParaPeriodo(estancias, cobro.inquilino_id, cobro.periodo_anio, cobro.periodo_mes);
    let viviendaRecibo = vivienda;
    let codigoHabitacion = habitacion?.codigo ?? "-";
    let alquiler = Number(cobro.alquiler);
    let gastos = Number(cobro.gastos);
    let titulares: Persona[] = [];

    if (estancia) {
      const { data: habitacionData, error: errorHabitacion } = await supabase
        .from("habitaciones").select("id, codigo, vivienda_id").eq("id", estancia.habitacion_id).single();
      if (errorHabitacion) { alert(errorHabitacion.message); return; }
      const habitacionHistorica = habitacionData as HabitacionDocumento;
      const { data: viviendaData, error: errorVivienda } = await supabase
        .from("viviendas").select("id, nombre, direccion").eq("id", habitacionHistorica.vivienda_id).single();
      if (errorVivienda) { alert(errorVivienda.message); return; }
      viviendaRecibo = viviendaData as ViviendaDocumento;
      codigoHabitacion = habitacionHistorica.codigo;
      alquiler = Number(estancia.precio);
      const idsTitulares = [...new Set(estancias
        .map((item) => estanciaParaPeriodo(estancias, item.inquilino_id, cobro.periodo_anio, cobro.periodo_mes))
        .filter((item): item is EstanciaEconomica => Boolean(item) && item.habitacion_id === estancia.habitacion_id)
        .map((item) => item.inquilino_id))];
      const { data: personasData, error: errorPersonas } = idsTitulares.length
        ? await supabase.from("inquilinos").select("id, nombre, apellidos").in("id", idsTitulares)
        : { data: [], error: null };
      if (errorPersonas) { alert(errorPersonas.message); return; }
      titulares = (personasData ?? []) as Persona[];
      gastos = Number(estancia.gastos) * Math.max(1, personasEnHabitacionPeriodo(estancias, estancia.habitacion_id, cobro.periodo_anio, cobro.periodo_mes));
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
      ? titulares.map((titular) => `${titular.nombre} ${titular.apellidos}`).join(" · ")
      : inquilino ? `${inquilino.nombre} ${inquilino.apellidos}` : "Inquilino no disponible";

    const habitacionFianzaId = estancia?.habitacion_id ?? cobro.habitacion_id;
    const { data: fianzasData, error: errorFianzas } = await supabase
      .from("fianzas").select("id, importe, importe_entregado")
      .eq("habitacion_id", habitacionFianzaId).eq("estado", "COBRADA")
      .order("created_at", { ascending: false }).limit(1);
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

    const total = alquiler + gastos;
    const pagado = Number(cobro.pagado);
    const pendiente = Math.max(total - pagado, 0);
    const mes = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(new Date(cobro.periodo_anio, cobro.periodo_mes - 1, 1));
    const ventana = window.open("", "_blank", "width=800,height=900");
    if (!ventana) { alert("El navegador ha bloqueado la ventana del recibo. Permite las ventanas emergentes e inténtalo de nuevo."); return; }
    const fecha = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date());

    ventana.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Recibo ${cobro.periodo_mes}-${cobro.periodo_anio}</title><style>body{font-family:Arial,sans-serif;color:#172033;padding:42px;max-width:720px;margin:auto}.cabecera{display:flex;justify-content:space-between;border-bottom:3px solid #2563eb;padding-bottom:18px}.titulo{font-size:26px;font-weight:700}.meta{color:#5b677c;text-align:right}.bloque{margin-top:28px}.etiqueta{font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.05em}.valor{font-size:16px;margin-top:5px}.fila{display:flex;justify-content:space-between;gap:20px;padding:13px 0;border-bottom:1px solid #e2e8f0}.total{font-size:21px;font-weight:700;border-top:2px solid #172033;padding-top:16px;margin-top:10px}.fianza{border:1px solid #c4b5fd;background:#faf5ff;border-radius:10px;padding:16px}.fianza .etiqueta{color:#6d28d9}.nota{color:#64748b;font-size:14px;padding-top:12px}.firma{margin-top:80px;text-align:center}.linea{border-top:1px solid #475569;padding-top:8px;width:45%;margin:auto}@media print{body{padding:24px}}</style></head><body><div class="cabecera"><div><div class="titulo">RECIBO DE PAGO</div><div class="meta" style="text-align:left">RoomFlow · Recibo mensual de habitación</div></div><div class="meta">Fecha de emisión: ${fecha}<br>Periodo: ${escapar(mes)}</div></div><div class="bloque"><div class="etiqueta">Propietario(s)</div><div class="valor">${escapar(listaPropietarios)}</div></div><div class="bloque"><div class="etiqueta">Inquilino(s)</div><div class="valor">${escapar(listaInquilinos)}</div></div><div class="bloque"><div class="etiqueta">Vivienda y habitación</div><div class="valor">${escapar(viviendaRecibo.nombre)}${viviendaRecibo.direccion ? ` · ${escapar(viviendaRecibo.direccion)}` : ""}<br>Habitación: ${escapar(codigoHabitacion)}</div></div><div class="bloque"><div class="etiqueta">Desglose correspondiente a ${escapar(mes)}</div><div class="fila"><span>Alquiler de habitación</span><strong>${moneda.format(alquiler)}</strong></div><div class="fila"><span>Gastos facturados</span><strong>${moneda.format(gastos)}</strong></div><div class="fila total"><span>Total mensual</span><span>${moneda.format(total)}</span></div><div class="fila"><span>Importe recibido</span><strong>${moneda.format(pagado)}</strong></div><div class="fila"><span>Importe pendiente</span><strong>${moneda.format(pendiente)}</strong></div></div>${bloqueFianza}<div class="firma"><div class="linea">Propietario(s)</div></div><script>window.opener=null;window.onload=()=>window.print()<\/script></body></html>`);
    ventana.document.close();
  }

  return <button style={{ width: 34, height: 34, border: "none", borderRadius: 6, background: "#eff6ff", color: "#2563eb", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Generar recibo" onClick={generar}><FileText size={18} /></button>;
}
